# Netlify Deployment Guide

## Prerequisites

- A [Netlify](https://netlify.com) account
- A [Neon](https://neon.tech) (or other PostgreSQL) database provisioned and seeded with the schema from `sql/University_postgres.sql` and seed data from `sql/seed_postgres.sql`
- This repo pushed to GitHub

---

## 1. Connect Your Repo

1. Go to **Netlify Dashboard → Add new site → Import an existing project**
2. Select **GitHub** and authorize access
3. Choose the `db_collage_project` repository
4. Branch to deploy: `master`

---

## 2. Build Settings

These are already configured in `netlify.toml`, but verify they match in the Netlify UI:

| Setting              | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| **Base directory**   | `/` (root)                                                             |
| **Build command**    | `pnpm install --frozen-lockfile && pnpm --dir frontend run build`      |
| **Publish directory**| `frontend/dist`                                                        |
| **Functions directory** | `backend/netlify/functions`                                         |

> **Important:** Do NOT use `pnpm --filter frontend` — pnpm `--filter` matches
> by the `name` field in `package.json` (`university-management-frontend`), not
> the directory name. Use `--dir frontend` instead.

---

## 3. Environment Variables

Go to **Site settings → Environment variables** and add:

| Variable              | Value                        | Notes                                      |
| --------------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`        | `postgresql://user:pass@host/db?sslmode=require` | Your Neon/PostgreSQL connection string |
| `VITE_API_BASE`       | `/api`                       | Frontend API base path (redirected to Netlify Functions) |
| `VITE_PREVIEW_MODE`   | `false`                      | Set to `true` to show a preview banner in the UI |

> `VITE_*` variables are embedded at **build time** by Vite. Changes require a redeploy.
> `DATABASE_URL` is read at **runtime** by the Netlify Function.

---

## 4. Neon Integration (Optional)

If using Neon as your database provider, install the **Neon extension** on Netlify:

1. Go to **Site settings → Extensions**
2. Search for **Neon** and install it
3. This automatically injects `DATABASE_URL` into your function environment

---

## 5. How It Works

```
Browser  →  /api/*  →  Netlify Function (backend/netlify/functions/api.js)  →  PostgreSQL
         →  /*      →  frontend/dist/index.html  (SPA fallback)
```

- **Frontend:** Vite-built React SPA served as static files from `frontend/dist`
- **Backend:** Express app wrapped with `serverless-http`, deployed as a single Netlify Function
- **Redirects** (defined in `netlify.toml`):
  - `/api/*` → proxied to `/.netlify/functions/api/:splat` (the Express function)
  - `/*` → `index.html` (SPA client-side routing fallback)

---

## 6. Troubleshooting

### "No projects matched the filters"

**Cause:** `pnpm --filter frontend` can't find a package named `frontend`.
**Fix:** Use `pnpm --dir frontend` (matches by directory, not package name).

### "Deploy directory 'frontend/dist' does not exist"

**Cause:** The build command didn't run or failed silently.
**Fix:** Ensure the build command uses `--dir` and check build logs for errors.

### "Ignored build scripts: esbuild, unrs-resolver"

**Cause:** pnpm v10+ blocks postinstall scripts by default.
**Fix:** Add to root `package.json`:

```json
"pnpm": {
  "onlyBuiltDependencies": ["esbuild", "unrs-resolver"]
}
```

Then run `pnpm install` locally and commit the updated lockfile.

### "Unsupported engine: wanted node 18.x"

This is a warning from the backend package — it doesn't block the build. To silence it, either:

- Update `backend/package.json` engines to `"node": ">=18"`
- Or set Node version in Netlify: **Site settings → Environment variables** → `NODE_VERSION` = `18`

### Function errors / DATABASE_URL not found

- Verify `DATABASE_URL` is set in **Netlify Environment Variables**
- Check function logs: **Netlify Dashboard → Functions → api → Logs**

---

## 7. Deploying

After initial setup, every push to `master` triggers an automatic deploy. You can also:

- **Trigger manual deploy:** Netlify Dashboard → Deploys → Trigger deploy
- **Preview deploy:** Open a pull request — Netlify creates a preview URL automatically

---

## Files Changed to Fix the Build

| File | Change |
| ---- | ------ |
| `netlify.toml` | `--filter frontend` → `--dir frontend` in build command |
| `package.json` | Added `pnpm.onlyBuiltDependencies` for `esbuild` and `unrs-resolver` |
| `frontend/.env` | Fixed typo: `VITE_PREVIEW_MODE=ture` → `true` |
