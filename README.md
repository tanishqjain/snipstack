# 🚀 Snipstack

A high-performance codebase for managing your technical snippet stack. Built with React, Node.js, and Postgres.

## 🛠 Features
- **Full-Text Search**: Optimized Postgres search with GIN indexing.
- **Dark Mode**: Minimalist, technical interface.
- **Command Palette**: `⌘K` for navigation and search.
- **Tagging**: Advanced categorization and filtering.

## 💻 Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   Create a `.env` file in `apps/api`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/snipstack"
   JWT_SECRET="your-super-secret-key"
   ```

3. **Launch Dev Stack**
   ```bash
   # Terminal 1: Database
   docker compose -f docker-compose.dev.yml up db

   # Terminal 2: Apps
   npm run dev
   ```

## 🐳 Production Deployment (Docker Compose)

```bash
docker compose -f docker-compose.prod.yml up --build
```

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres Connection String | - |
| `JWT_SECRET` | Secret for auth tokens | - |
| `VITE_API_URL` | Frontend API Proxy Target | `/api` |

## 🏗 CI/CD
Fully automated pipeline via GitHub Actions:
- **Linting**: Consistent code style.
- **Testing**: Automated integration tests with a Postgres service container.
- **Building**: Verification of artifacts.
