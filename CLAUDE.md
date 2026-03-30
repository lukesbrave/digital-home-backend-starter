# Digital Home Backend

## First Time Setup

If you just cloned this repo, follow these steps in order. You need both this repo (Backend) and the [Digital Home Frontend](https://github.com/lukesbrave/digital-home-starter) repo. **Set up the Frontend first** — it has the database migrations.

### Step 1: Supabase + Migrations (Frontend First)
If you haven't already, follow the Frontend CLAUDE.md Steps 1-3 to create your Supabase project, run all Frontend migrations (`001` through `011`), and create an admin user. Then run this repo's migration:

- `supabase/migrations/001_backend_core.sql`

Both repos share the same database. The Frontend owns the shared website schema; this repo owns `backend_settings` and `brand_context`.

### Step 2: Set Up Environment Variables
```bash
cp .env.local.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
- `DIGITAL_HOME_URL` — your Frontend's live URL (e.g., `https://yourdomain.com`)
- `API_SECRET_KEY` — a shared secret you choose (must match the Frontend)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com) (for AI article writing)
- `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com) (for DALL-E hero images, optional)

### Step 3: Seed Your Brand Context
Your brand context is what makes the AI write in your voice. First, fill in your content corpus files (see the Frontend's `content-corpus-examples/` for the format). Then seed them into Supabase either:

- via the Supabase dashboard / SQL editor, or
- via the authenticated `/api/setup` route after logging into the Backend

> **⚠️ This is the most important step.** The content corpus is what separates AI that writes like you from AI that writes generic slop. A properly built corpus includes: voice guide, tone examples, content hooks, core positioning, offer architecture, competitive landscape, SEO keyword clusters, and case studies/testimonials. If you haven't completed your content corpus in the Frontend setup, do that first. A structured brand intake process and content corpus skill are available in the [BraveBrand community](https://www.skool.com/bravebrand).

You also need two special entries in the `brand_context` table:

**CTA Links** — the links the AI will use in article CTAs:
```
category: cta
key: links
content: (your CTA links in HTML — one per line, with descriptions of when to use each)
```

**Author Name** — the byline on articles:
```
category: identity
key: author
content: [Your Name]
```

**Image Style** — controls the AI-generated hero images for articles (uses DALL-E):
```
category: content
key: image_style
content: (your image style description — composition, color palette, lighting, mood, what to avoid)
```
If no image style is configured, the system uses a clean editorial photography default. You can describe any aesthetic — minimalist, bold, illustrated, photographic — and every generated hero image will follow it.

You can add these via the Supabase dashboard (Table Editor → brand_context → Insert row) or via the authenticated `/api/setup` endpoint.

### Step 4: Install and Run
```bash
npm install
npm run dev
```
Open `http://localhost:3001` and log in with the admin user you created in Supabase.

### Step 5: Deploy to Cloudflare

> **⚠️ `wrangler.jsonc` and git:** The repo ships with placeholder values in `wrangler.jsonc` (for open-source cloners). Your real Supabase URL, anon key, and domain are set **locally only** and must NOT be committed back to git. If `wrangler.jsonc` shows up in `git status` as modified, that's expected — leave it uncommitted. If you accidentally commit it, revert with `git checkout HEAD -- wrangler.jsonc` after deploying.

```bash
npx opennextjs-cloudflare build
npx wrangler deploy
```
Then set server-side secrets:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put API_SECRET_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put DIGITAL_HOME_URL
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```
When prompted, paste ONLY the value (not the variable name).

### Step 6: Verify Everything Works
Log into the Backend, then visit `https://your-backend-url.com/api/test-frontend` to check the Backend→Frontend connection. You should see `api_key_set: true` and `status: 200`.

---

## What This Is
The Digital Home Backend is the operating system behind a Digital Home. It's a standalone application that manages content, leads, email, analytics, and AI agents — replacing rented SaaS admin panels with a single, owned, agent-native system.

The Backend connects to the same Supabase database as the Digital Home Frontend (the public-facing website). The Frontend is the storefront. The Backend is the back office.

**Open-source:** Any consultant or business can deploy their own Digital Home Frontend + Backend stack on their own infrastructure. The value is in your content corpus, agent prompts, and implementation expertise — not the platform code.

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     DIGITAL HOME        │     │     BACKEND             │
│  (Public Website)       │     │  (Backend/CRM)          │
│                         │     │                         │
│  - Homepage             │     │  - Content Pipeline     │
│  - Blog                 │     │  - Lead Management      │
│  - Services             │     │  - Email Sequences      │
│  - Contact              │     │  - Analytics            │
│  - API Routes           │     │  - Agent Oversight      │
│                         │     │  - Knowledge Graph      │
│  yourdomain.com         │     │  backend.yourdomain.com  │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            └───────────┬───────────────────┘
                        │
              ┌─────────▼─────────┐
              │     SUPABASE      │
              │  (Shared Database) │
              │                   │
              │  content_objects   │
              │  content_calendar  │
              │  visitors          │
              │  leads             │
              │  analytics_events  │
              │  agent_logs        │
              │  ...               │
              └───────────────────┘
```

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — shared with the Digital Home
- **Auth:** Supabase Auth (email/password, no public signup)
- **Deployment:** Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext) — separate deployment from the Digital Home

## Backend Modules

### Module 1: Content Pipeline (built)
- Content calendar with status pipeline (planned → approved → writing → draft → published → archived)
- Priority management (high/medium/low)
- Publishing mode toggle (safe = drafts for review, autonomous = auto-publish)
- Bulk approve/archive actions
- Connects to Claude Code skills: `/content-strategy`, `/write-article`, `/trend-scan`
- GitHub Actions for daily publishing and weekly trend scanning — **Note:** The workflow files live in the Frontend repo (`.github/workflows/`), not here. They call the Backend's `/api/write-article` route. See the Frontend CLAUDE.md Step 9 for setup instructions.

### Module 2: Lead Management (planned)
- Lead pipeline from the Digital Home's email capture forms
- Lead scoring based on visitor behavior
- Segment management
- Replaces rented CRM contacts/pipeline

### Module 3: Email Sequences (planned)
- Sequence builder and management
- Send history and analytics
- Uses Resend API (same as the Digital Home)
- Replaces rented email/automation platforms

### Module 4: Analytics (planned)
- Visitor analytics dashboard
- Content performance metrics
- Conversion tracking
- AI traffic reporting
- Replaces rented analytics dashboards

### Module 5: Agent Oversight (planned)
- Agent activity logs and audit trail
- Agent performance metrics (tokens used, actions taken, success rates)
- Manual agent triggers
- This is what no existing CRM can do

### Module 6: Knowledge Graph (planned)
- Entity management (organizations, people, services, concepts)
- Relationship mapping
- JSON-LD generation oversight
- SEO schema management

## Project Structure
```
/digital-home-backend/
  CLAUDE.md              ← You are here
  /src
    /app
      layout.tsx         ← Sidebar nav + auth layout
      page.tsx           ← Redirects to /content
      /content           ← Content Pipeline module
      /login             ← Auth login page
    /components          ← Shared UI components
    /lib
      /supabase          ← Supabase client (shared credentials with Digital Home)
    /types
      database.ts        ← Shared database types (keep in sync with Digital Home)
    middleware.ts        ← Auth guard — redirects to /login if no session
```

## Environment Variables

There are two types of environment variables. Getting this wrong is the most common deployment issue.

### Build-time public variables
These are baked into JavaScript at build time. They go in the Cloudflare dashboard (Settings > Variables & Secrets) AND in `wrangler.jsonc` under `vars`:
```
NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL (same as Digital Home)
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key (same as Digital Home)
NEXT_PUBLIC_DIGITAL_HOME_URL  — Public site URL used for "View live" links in the dashboard
```

### Server-side secrets
These MUST be set using `wrangler secret put` from the terminal. The Cloudflare dashboard UI does NOT work for Workers secrets — only for Pages projects.
```
SUPABASE_SERVICE_ROLE_KEY     — Service role key, bypasses RLS (same as Digital Home)
SUPABASE_ANON_KEY             — Duplicate of anon key for server-side access (Workers can't read NEXT_PUBLIC_ at runtime)
SUPABASE_URL                  — Duplicate of Supabase URL for server-side access (same reason)
API_SECRET_KEY                — Shared secret between Frontend and Backend (must match both)
ANTHROPIC_API_KEY             — Anthropic API key for AI article writing
OPENAI_API_KEY                — OpenAI API key for DALL-E hero images
DIGITAL_HOME_URL              — The public-facing Digital Home URL (e.g., https://yourdomain.com)
```

**Common mistakes when setting secrets:**
- When `wrangler secret put` prompts for a value, paste ONLY the value (e.g., `my-api-secret-key`), NOT the variable name with it (e.g., NOT `API_SECRET_KEY=my-api-secret-key`)
- `DIGITAL_HOME_URL` must be the live Frontend URL (e.g., `https://yourdomain.com`), NOT `http://localhost:3000`
- `API_SECRET_KEY` must be identical on both the Frontend and Backend Workers
- The Frontend also needs its own secrets set via `wrangler secret put` — see the Frontend CLAUDE.md

### Verifying API connectivity
After setting all secrets, log into the Backend and test the Backend→Frontend connection by visiting:
```
https://your-backend-url.com/api/test-frontend
```
This returns the Frontend URL, API key status, and whether the Frontend responds. Check:
- `api_key_set` should be `true`
- `status` should be `200`
If `status` is `401`, the API key doesn't match between Backend and Frontend. Re-set it on both.

## Important Conventions
- **Auth required on all pages** except `/login`. Middleware handles the redirect.
- **No public signup.** Admin users are created directly in Supabase dashboard.
- **Protected API routes for admin data.** The dashboard should read and write admin tables through authenticated Next API routes, not browser-side Supabase queries.
- **Digital Home API** for content writes that need shared-site side effects (e.g., publishing content triggers SEO metadata generation in the Frontend).
- **Route auth split:**
  - session-only: admin dashboard APIs (`/api/articles`, `/api/content-calendar`, `/api/publish`, `/api/reset-writing`, `/api/settings`, `/api/setup`, `/api/test-frontend`)
  - session or API key: machine-triggered article writing (`/api/write-article`, `/api/write-now`)
- **Dark theme only.** This is a professional dashboard, not a consumer app.
- **CRITICAL — Shared database types:** When you modify `src/types/database.ts` or add/change a Supabase migration, you MUST also update the same `src/types/database.ts` file in the Digital Home Frontend project (located at `../Digital Home 2.0/src/types/database.ts`). These two files must always be identical. After making changes, copy the updated file to the other project immediately.

## Cloudflare / OpenNext Rules

This project runs on Cloudflare Workers via `@opennextjs/cloudflare` (OpenNext). The older `@cloudflare/next-on-pages` adapter is **deprecated and incompatible**. If you see `next-on-pages` in tutorials, ignore it — the two systems want opposite things. These rules prevent build failures:

### NEVER add edge runtime exports
Do **not** add `export const runtime = 'edge'` to any route file. OpenNext handles runtime assignment itself and **rejects** manual edge runtime exports. This is the #1 cause of broken builds. Old Cloudflare tutorials recommend this pattern — it does not apply here.

### NEXT_PUBLIC_ vars don't exist at runtime on Workers
Cloudflare Workers can only read `NEXT_PUBLIC_` variables at build time (they're baked into the JS bundle). At runtime on the server, they're `undefined`. This is why:
- `wrangler.jsonc` has both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` in `vars`
- `src/lib/supabase/server.ts` uses the fallback pattern: `process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL`
- When creating new server-side code that reads env vars, always use this fallback pattern for any `NEXT_PUBLIC_` variable

### Always run `npm run build` before pushing
`next dev` does not catch all TypeScript errors. `next build` does. Always build locally before pushing to catch errors that would fail the Cloudflare build.

### New Supabase tables must be in the types file
If you add a new table to Supabase but don't add it to `src/types/database.ts`, the production build will fail with TypeScript errors. Either add the table to the types file or use `as any` as a temporary escape hatch.

### Build artifacts must stay out of git
These directories are generated during builds and must never be committed:
```
.vercel/
.open-next/
.wrangler/
```

### The build command is `npm run build`
Do **not** use `npx @cloudflare/next-on-pages@1` or any other build command. Wrangler's deploy step handles the OpenNext conversion automatically after a standard Next.js build.

### Secrets must be set via Wrangler CLI
Server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, etc.) must be set using `wrangler secret put`. The Cloudflare dashboard UI only works for Pages projects, not Workers. Secrets set via Wrangler take effect immediately without a rebuild.

## Decision Log

### Dashboard as separate app
- **Decision:** Split the admin dashboard out of the Digital Home into a standalone Backend app
- **Why:** The Frontend is the client-facing storefront. The Backend is the operating system — content management, lead tracking, email, analytics, agent oversight. Keeping them separate means: (1) the Frontend stays lean and fast, (2) the Backend can be open-sourced independently, (3) every deployment gets two apps — public site + private backend, (4) own the entire stack, replace rented platforms with owned infrastructure.
- **Alternatives considered:** Admin pages inside the Digital Home. Rejected because it conflates the public-facing site with the back office, makes open-sourcing harder, and doesn't scale to a multi-module platform.

### Open-source architecture
- **Decision:** Design the Backend for open-source from day one
- **Why:** The moat is the content corpus, agent prompts, and implementation expertise — not the platform code. Open-sourcing: (1) builds trust and authority, (2) creates a community of contributors, (3) establishes the standard for AI-native digital infrastructure.
