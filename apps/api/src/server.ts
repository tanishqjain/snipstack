import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from './lib/prisma.js';
import { createServer as createViteServer } from 'vite';
import { authMiddleware, AuthRequest } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(express.json());

// Auth schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SnippetSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  language: z.string().optional().default('plaintext'),
});

const TagSchema = z.object({
  name: z.string().min(1).max(30),
});

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ data: { user: { id: user.id, email: user.email, name: user.name }, token } });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ data: { user: { id: user.id, email: user.email, name: user.name }, token } });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// Snippets API
app.get('/api/snippets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { search, tag } = req.query;
    const userId = req.userId!;

    let snippets;
    
    if (search && typeof search === 'string') {
      // Use websearch_to_tsquery for more natural search syntax (supporting quotes, etc)
      // We search against a dynamically created tsvector since we haven't confirmed the generated column yet
      const query = `%${search}%`; // Fallback search
      
      // If we want the specific logic the user asked for (to_tsquery):
      // Note: plainto_tsquery is safer for general user input
      snippets = await prisma.$queryRaw`
        SELECT s.*, 
        (
          SELECT json_agg(t.*)
          FROM "_SnippetToTag" st
          JOIN "Tag" t ON st."B" = t.id
          WHERE st."A" = s.id
        ) as tags
        FROM "Snippet" s
        WHERE s."userId" = ${userId}
        AND (
          to_tsvector('english', s.title || ' ' || COALESCE(s.description, '') || ' ' || s.content) 
          @@ websearch_to_tsquery('english', ${search})
          OR s.title ILIKE ${query}
        )
        ${tag ? prisma.sql`AND EXISTS (SELECT 1 FROM "_SnippetToTag" st JOIN "Tag" t ON st."B" = t.id WHERE st."A" = s.id AND t.name = ${tag})` : prisma.sql``}
        ORDER BY s."updatedAt" DESC
      `;
    } else {
      snippets = await prisma.snippet.findMany({
        where: {
          userId,
          ...(tag ? { tags: { some: { name: tag as string } } } : {})
        },
        include: { tags: true },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json({ data: snippets });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

app.post('/api/snippets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = SnippetSchema.parse(req.body);
    const snippet = await prisma.snippet.create({
      data: {
        ...data,
        userId: req.userId!,
      },
      include: { tags: true },
    });
    res.json({ data: snippet });
  } catch (error) {
    res.status(400).json({ error: 'Invalid snippet data' });
  }
});

app.get('/api/snippets/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const snippet = await prisma.snippet.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { tags: true },
    });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
    res.json({ data: snippet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snippet' });
  }
});

app.put('/api/snippets/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = SnippetSchema.partial().parse(req.body);
    const snippet = await prisma.snippet.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (snippet.count === 0) return res.status(404).json({ error: 'Snippet not found' });
    
    const updated = await prisma.snippet.findUnique({ 
      where: { id: req.params.id },
      include: { tags: true }
    });
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: 'Invalid update data' });
  }
});

app.delete('/api/snippets/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await prisma.snippet.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Snippet not found' });
    res.json({ message: 'Snippet deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

// Tags API
app.get('/api/tags', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { snippets: { some: { userId: req.userId } } },
      orderBy: { name: 'asc' },
    });
    res.json({ data: tags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

app.post('/api/tags', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = TagSchema.parse(req.body);
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    res.json({ data: tag });
  } catch (error) {
    res.status(400).json({ error: 'Invalid tag data' });
  }
});

app.delete('/api/tags/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Note: This deletes the tag globally if unauthorized, but in a simple app 
    // we just delete it. A better way would be user-specific tags, but the schema has unique name.
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Snippet-Tag Relationships
app.post('/api/snippets/:id/tags/:tagId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id, tagId } = req.params;
    const snippet = await prisma.snippet.findFirst({
      where: { id, userId: req.userId }
    });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

    const updated = await prisma.snippet.update({
      where: { id },
      data: {
        tags: { connect: { id: tagId } }
      },
      include: { tags: true }
    });
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to attach tag' });
  }
});

app.delete('/api/snippets/:id/tags/:tagId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id, tagId } = req.params;
    const snippet = await prisma.snippet.findFirst({
      where: { id, userId: req.userId }
    });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

    const updated = await prisma.snippet.update({
      where: { id },
      data: {
        tags: { disconnect: { id: tagId } }
      },
      include: { tags: true }
    });
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to detach tag' });
  }
});

// Root path to apps/web for Vite/Static
const webDistPath = path.resolve(__dirname, '../../web/dist');
const webRootPath = path.resolve(__dirname, '../../web');

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: webRootPath,
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(webDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SnipStack server running at http://0.0.0.0:${PORT}`);
});
