# College Management System (Student Project)

Cleaned full-stack college database project prepared for local development and cloud preview.

## Tech Stack

- Frontend: React + Vite + MUI
- Backend: Node.js + Express
- Database: PostgreSQL

## Project Structure

```text
backend/   Express API + database access
frontend/  React client
sql/       Database schema + seed scripts
data/      Original course project documents
```

## Main Improvements

- Cleaned naming (faculty-focused API/UI wording instead of mixed employee wording).
- Backend is PostgreSQL-ready using `pg`.
- API base URL is configurable from frontend env.
- Added guest preview mode (read-only for non-GET requests).
- Added Netlify setup for unified React + Express deployment.
- Updated READMEs for root, backend, and frontend.

## Local Setup

1. Create database and run schema/seed:

```bash
psql -U <user> -d <db_name> -f sql/University_postgres.sql
psql -U <user> -d <db_name> -f sql/seed_postgres.sql
```

1. Create env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

1. Install dependencies:

```bash
pnpm install
```

1. Run apps:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

## Environment Variables

Backend (`backend/.env`):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_DATABASE=university
DB_SSL=false
PREVIEW_MODE=false
```

Frontend (`frontend/.env`):

```env
VITE_API_BASE=/api
VITE_PREVIEW_MODE=false
```

## Guest Preview Mode

Use this for cloud demo links:

- `PREVIEW_MODE=true` in backend
- `VITE_PREVIEW_MODE=true` in frontend

Behavior:

- `GET` requests are allowed.
- `POST`, `PUT`, and `DELETE` are blocked by backend with `403`.
- Client UI disables create/update/delete buttons.

## Netlify Setup (Unified React + Express)

### `netlify.toml`

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm --filter frontend run build"
  publish = "frontend/dist"
  functions = "backend/netlify/functions"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["express", "cors", "dotenv", "pg", "serverless-http"]

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Netlify function entry (`backend/netlify/functions/api.js`)

```js
const serverless = require('serverless-http');
require('dotenv').config();

const { poolConnect } = require('../../src/db');
const { createApp } = require('../../src/app');

const app = createApp();
let dbReady = false;

async function ensureDbConnection() {
  if (!dbReady) {
    await poolConnect;
    dbReady = true;
  }
}

module.exports.handler = async (event, context) => {
  await ensureDbConnection();
  const handler = serverless(app);
  return handler(event, context);
};
```

Local Netlify test:

```bash
pnpm run dev:netlify
```
