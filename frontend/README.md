# Frontend App

React + Vite UI for the College Management System.

## Run

```bash
cp .env.example .env
pnpm install
pnpm run dev
```

## Environment

```env
VITE_API_BASE=/api
VITE_PREVIEW_MODE=false
```

## Notes

- `VITE_API_BASE` controls API base URL (`/api` locally with Vite proxy).
- `VITE_PREVIEW_MODE=true` shows preview banner and disables edit actions.
- Navigation and UI use cleaned naming with `Faculty` as the main term.
