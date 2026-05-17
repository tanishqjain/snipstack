import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Add Postgres Full-Text Search Column and Index
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Snippet" ADD COLUMN IF NOT EXISTS "searchVector" tsvector 
      GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content)
      ) STORED;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "snippet_search_idx" ON "Snippet" USING GIN ("searchVector");
    `);
    console.log('Search vector column and GIN index ensured.');
  } catch (error) {
    console.warn('Full-text search indexing setup failed (might already exist or not on Postgres):', error);
  }

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log({ user });

  const snippets = await Promise.all([
    prisma.snippet.create({
      data: {
        title: 'React UseState',
        description: 'Basic hook for state management in functional components',
        content: 'const [state, setState] = useState(null);',
        language: 'typescript',
        userId: user.id,
        tags: {
          connectOrCreate: {
            where: { name: 'react' },
            create: { name: 'react' },
          },
        },
      },
    }),
    prisma.snippet.create({
      data: {
        title: 'Express Setup',
        description: 'Minimal express server configuration',
        content: 'const app = express(); app.listen(3000);',
        language: 'javascript',
        userId: user.id,
        tags: {
          connectOrCreate: {
            where: { name: 'backend' },
            create: { name: 'backend' },
          },
        },
      },
    }),
    prisma.snippet.create({
      data: {
        title: 'Tailwind Base',
        description: 'Common tailwind entry point',
        content: '@import "tailwindcss";',
        language: 'css',
        userId: user.id,
        tags: {
          connectOrCreate: {
            where: { name: 'styling' },
            create: { name: 'styling' },
          },
        },
      },
    }),
  ]);

  console.log({ snippets });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
