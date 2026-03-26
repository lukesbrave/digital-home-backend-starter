# Digital Home Backend

## What This Is
The Digital Home Backend is the operating system behind a Digital Home. It's a standalone application that manages content, leads, email, analytics, and AI agents — replacing tools like GHL, HubSpot, and WordPress admin panels with a single, owned, agent-native system.

The Backend connects to the same Supabase database as the Digital Home Frontend (the public-facing website). The Frontend is the storefront. The Backend is the back office.

**Open-source ambition:** This Backend is designed to be open-sourced. Any consultant or business can deploy their own Digital Home Frontend + Backend stack on their own infrastructure. BraveBrand's value is in the content corpus, agent prompts, implementation expertise, and community — not the code.

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
│  bravebrand.com         │     │  backend.bravebrand.com  │
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
- GitHub Actions for daily publishing and weekly trend scanning

### Module 2: Lead Management (planned)
- Lead pipeline from the Digital Home's email capture forms
- Lead scoring based on visitor behavior
- Segment management
- Replaces GHL contacts/pipeline

### Module 3: Email Sequences (planned)
- Sequence builder and management
- Send history and analytics
- Uses Resend API (same as the Digital Home)
- Replaces GHL email/automations

### Module 4: Analytics (planned)
- Visitor analytics dashboard
- Content performance metrics
- Conversion tracking
- AI traffic reporting
- Replaces GHL reporting

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

## Important Conventions
- **Auth required on all pages** except `/login`. Middleware handles the redirect.
- **No public signup.** Admin users are created directly in Supabase dashboard.
- **Direct Supabase queries** for read operations (faster than going through the Digital Home API).
- **Digital Home API** for write operations that need to trigger side effects (e.g., publishing content triggers SEO metadata generation).
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

### 2026-03-25 — Dashboard as separate app
- **Decision:** Split the admin dashboard out of the Digital Home into a standalone Dashboard app
- **Why:** The Frontend is the client-facing storefront. The Backend is the operating system — content management, lead tracking, email, analytics, agent oversight. Keeping them separate means: (1) the Frontend stays lean and fast, (2) the Backend can be open-sourced independently, (3) clients get two deployments — their public site and their private backend, (4) this is the digital sovereignty play — own the entire stack, replace GHL/HubSpot/WordPress.
- **Alternatives considered:** Admin pages inside the Digital Home. Rejected because it conflates the public-facing site with the back office, makes open-sourcing harder, and doesn't scale to a multi-module platform.

### 2026-03-25 — Open-source architecture
- **Decision:** Design the Dashboard for open-source from day one
- **Why:** BraveBrand's moat is the content corpus, agent prompts, implementation expertise, and community — not the platform code. Open-sourcing the Dashboard: (1) builds trust and authority, (2) creates a community of contributors, (3) makes BraveBrand the standard for AI-native digital infrastructure, (4) the "WordPress of the AI era" positioning.
