# Deployment Guide

This guide covers deploying the Digital Home Backend to Cloudflare Pages using OpenNext, with a Vercel alternative for simpler setups.

## Important: OpenNext, Not next-on-pages

This project uses **@opennextjs/cloudflare** (OpenNext) to run Next.js on Cloudflare Workers. The older `@cloudflare/next-on-pages` adapter is **deprecated** and incompatible with this setup. If you see references to `next-on-pages` in tutorials or docs, ignore them — the two systems want opposite things.

---

## Prerequisites

- Node.js 18+
- A Cloudflare account
- A Supabase project with the required tables
- GitHub repository with the code pushed

---

## Step 1: Supabase Setup

Run these SQL commands in the Supabase SQL Editor to create the required tables:

```sql
-- Create brand context table
CREATE TABLE IF NOT EXISTS brand_context (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backend settings table
CREATE TABLE IF NOT EXISTS backend_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE brand_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE backend_settings ENABLE ROW LEVEL SECURITY;

-- Service role access only
CREATE POLICY "Service role full access" ON brand_context
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON backend_settings
  FOR ALL USING (auth.role() = 'service_role');
```

## Step 2: Create Admin User

There is no public signup. Create your admin user manually:

1. Go to Supabase Dashboard
2. Navigate to Authentication > Users > Add User
3. Enter your email and a strong password
4. Check **Auto-confirm user**

## Step 3: Deploy to Cloudflare

1. Go to Cloudflare Dashboard > Workers & Pages > Create
2. Connect your GitHub repository
3. Set the build configuration:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (default)
4. Click Deploy
5. After the first successful deploy, Cloudflare will open a PR on your repo with configuration files (`wrangler.jsonc`, `open-next.config.ts`, etc.) — **merge this PR immediately**

## Step 4: Environment Variables

There are two types of environment variables. Getting this wrong is the most common deployment issue.

### Public variables (baked into JavaScript at build time)

These go in the Cloudflare dashboard (Settings > Variables & Secrets) AND in `wrangler.jsonc` under `vars`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

These are safe to expose — they are restricted by Row Level Security.

### Server-side secrets (must be set via Wrangler CLI)

These MUST be set using `wrangler secret put` from your terminal. The Cloudflare dashboard UI does NOT work for Workers — only for Pages projects. This is the most common gotcha.

```bash
echo "your-value" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
echo "your-value" | npx wrangler secret put SUPABASE_ANON_KEY
echo "your-value" | npx wrangler secret put API_SECRET_KEY
echo "your-value" | npx wrangler secret put ANTHROPIC_API_KEY
echo "your-value" | npx wrangler secret put OPENAI_API_KEY
echo "your-value" | npx wrangler secret put DIGITAL_HOME_URL
```

| Secret | Description |
|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Duplicate of the anon key for server-side access |
| `API_SECRET_KEY` | Shared secret between Frontend and Backend (must match both) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI article writing |
| `OPENAI_API_KEY` | OpenAI API key for DALL-E hero images |
| `DIGITAL_HOME_URL` | Your public frontend URL (e.g., `https://yourdomain.com`) |

Secrets set via Wrangler take effect immediately — no rebuild needed.

## Step 5: Seed Brand Context

After deploying, call the setup endpoint once to load brand context into the database:

```bash
curl -X POST https://your-backend-url/api/setup
```

## Step 6: Custom Domain (Optional)

In Cloudflare > your project > Custom Domains > Add Domain. Point `backend.yourdomain.com` to the worker.

---

## Vercel Alternative

If you do not need Cloudflare specifically, Vercel is simpler:

1. Import the repo at [vercel.com](https://vercel.com)
2. Add environment variables
3. Deploy

No build configuration is needed. Next.js is made by Vercel, so it works out of the box. The trade-off: Vercel is more expensive at scale and you have less infrastructure control.

---

## Lessons Learned

These are hard-won lessons from the initial deployment. Read these before debugging a failed build.

### Build command must be `npm run build`

Do **not** use `npx @cloudflare/next-on-pages@1` as the build command. That is the old adapter. Wrangler's deploy step handles the OpenNext conversion automatically after a standard Next.js build.

### Do NOT add edge runtime exports

Do **not** add `export const runtime = 'edge'` to your route files. OpenNext handles runtime configuration itself. The old `@cloudflare/next-on-pages` required these exports, but OpenNext **rejects** them. If you see this pattern in old Cloudflare tutorials, skip it.

### TypeScript errors only surface in production builds

`next dev` (local development) does not catch all type errors. `next build` (production) does. Always run `npm run build` locally before pushing to catch errors early.

### Build artifacts do not belong in git

The `.vercel/output` directory is a build artifact created during the build process. These directories should all be in `.gitignore`:

```
.vercel/
.open-next/
.wrangler/
```

### New Supabase tables must be in the types file

If you add a new table to Supabase but do not add it to `src/types/database.ts`, the Cloudflare production build will fail with TypeScript errors. Either add the table to the types file or use a type assertion:

```typescript
.from("table_name" as any)
```

---

## Troubleshooting

### "routes were not configured to run with the Edge Runtime"

You are using the old `@cloudflare/next-on-pages` build command. Change the build command to `npm run build`.

### "cannot use the edge runtime" (OpenNext error)

Remove `export const runtime = 'edge'` from all route files. OpenNext handles runtime assignment and does not accept manual edge runtime exports.

### TypeScript errors during Cloudflare build

Run `npm run build` locally to reproduce and fix the errors before pushing. Common causes:

- **New tables not in `database.ts` types** — add the table definition or use a type assertion
- **String parameters not matching union types** — add an `as Type` assertion

### Build artifacts committed to git

If `.vercel/`, `.open-next/`, or `.wrangler/` directories were committed, remove them:

```bash
git rm -r --cached .vercel .open-next .wrangler
echo ".vercel/" >> .gitignore
echo ".open-next/" >> .gitignore
echo ".wrangler/" >> .gitignore
git add .gitignore
git commit -m "Remove build artifacts and update gitignore"
```

