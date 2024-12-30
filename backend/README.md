# Backend API

Express API for the College Management System.

## Run Locally

```bash
cp .env.example .env
pnpm install
pnpm run dev
```

## Environment

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

## Structure

- `src/app.js`: Express app factory (shared by local server and Netlify function).
- `src/server.js`: local server bootstrap (`app.listen`).
- `src/db`: PostgreSQL connection and query compatibility helpers.
- `src/routes`: API routes.
- `netlify/functions/api.js`: serverless entry point.

## Notes

- Uses PostgreSQL (`pg`).
- API surface uses `/api/faculty` for staff management.
- Keeps legacy field casing in responses for frontend compatibility.
- `PREVIEW_MODE=true` blocks non-GET operations for guest preview links.

## Routes

- `/api/health`
- `/api/students`
- `/api/faculty`
- `/api/courses`
- `/api/departments`
- `/api/registrations`
- `/api/lectures`
- `/api/labs`
