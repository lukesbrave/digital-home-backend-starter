# Digital Home Platform

## What This Is
The Digital Home Platform is the operating system behind a Digital Home. It's a standalone dashboard application that manages content, leads, email, analytics, and AI agents — replacing tools like GHL, HubSpot, and WordPress admin panels with a single, owned, agent-native system.

The Platform connects to the same Supabase database as the Digital Home (the public-facing website). The Digital Home is the storefront. The Platform is the back office.

**Open-source ambition:** This platform is designed to be open-sourced. Any consultant or business can deploy their own Digital Home + Platform stack on their own infrastructure. BraveBrand's value is in the content corpus, agent prompts, implementation expertise, and community — not the platform code.

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     DIGITAL HOME        │     │     PLATFORM            │
│  (Public Website)       │     │  (Dashboard/CRM)        │
│                         │     │                         │
│  - Homepage             │     │  - Content Pipeline     │
│  - Blog                 │     │  - Lead Management      │
│  - Services             │     │  - Email Sequences      │
│  - Contact              │     │  - Analytics            │
│  - API Routes           │     │  - Agent Oversight      │
│                         │     │  - Knowledge Graph      │
│  bravebrand.com         │     │  app.bravebrand.com     │
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
- **Deployment:** Cloudflare Pages (separate deployment from the Digital Home)

## Platform Modules

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
/digital-home-platform/
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
```
NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL (same as Digital Home)
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key (same as Digital Home)
SUPABASE_SERVICE_ROLE_KEY     — Service role key (same as Digital Home)
DIGITAL_HOME_URL              — The public-facing Digital Home URL
API_SECRET_KEY                — API key for authenticating with Digital Home API routes
```

## Important Conventions
- **Auth required on all pages** except `/login`. Middleware handles the redirect.
- **No public signup.** Admin users are created directly in Supabase dashboard.
- **Direct Supabase queries** for read operations (faster than going through the Digital Home API).
- **Digital Home API** for write operations that need to trigger side effects (e.g., publishing content triggers SEO metadata generation).
- **Dark theme only.** This is a professional dashboard, not a consumer app.
- **database.ts must stay in sync** between the Platform and Digital Home. When the schema changes, update both.

## Decision Log

### 2026-03-25 — Platform as separate app
- **Decision:** Split the admin dashboard out of the Digital Home into a standalone Platform app
- **Why:** The Digital Home is the client-facing storefront. The Platform is the operating system — content management, lead tracking, email, analytics, agent oversight. Keeping them separate means: (1) the Digital Home stays lean and fast, (2) the Platform can be open-sourced independently, (3) clients get two deployments — their public site and their private dashboard, (4) this is the digital sovereignty play — own the entire stack, replace GHL/HubSpot/WordPress.
- **Alternatives considered:** Admin pages inside the Digital Home. Rejected because it conflates the public-facing site with the back office, makes open-sourcing harder, and doesn't scale to a multi-module platform.

### 2026-03-25 — Open-source architecture
- **Decision:** Design the Platform for open-source from day one
- **Why:** BraveBrand's moat is the content corpus, agent prompts, implementation expertise, and community — not the platform code. Open-sourcing the Platform: (1) builds trust and authority, (2) creates a community of contributors, (3) makes BraveBrand the standard for AI-native digital infrastructure, (4) the "WordPress of the AI era" positioning.
