# Digital Home Backend Starter

The operating system behind a Digital Home — an open-source backend that manages content, leads, email, analytics, and AI agents. A single, owned, agent-native system — no platform lock-in, no monthly SaaS fees for features you could own.

This is the **Backend** (the operating system). Behind every [Digital Home Frontend](https://github.com/lukesbrave/digital-home-frontend-starter) (the public-facing website), this Backend handles everything that happens behind the scenes. Both share the same Supabase database.

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     FRONTEND             │     │     BACKEND             │
│  (Public Website)        │     │  (Operating System)     │
│                          │     │                         │
│  Homepage, Blog,         │     │  Content Pipeline,      │
│  Services, Contact,      │     │  Lead Management,       │
│  SEO, AI Detection       │     │  Email, Analytics,      │
│                          │     │  Agent Oversight         │
│  yourdomain.com          │     │  backend.yourdomain.com │
└───────────┬──────────────┘     └───────────┬─────────────┘
            └───────────┬────────────────────┘
                        │
              ┌─────────▼─────────┐
              │     SUPABASE      │
              │  (Shared Database) │
              └───────────────────┘
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Content Pipeline | Built | AI-powered content calendar, article writing, hero image generation, one-click publishing |
| Lead Management | Planned | Lead scoring, segmentation, pipeline from email capture |
| Email Sequences | Planned | Sequence builder, send history, analytics (via Resend) |
| Analytics | Planned | Visitor analytics, content performance, AI traffic reporting |
| Agent Oversight | Planned | Agent activity logs, performance metrics, manual triggers |
| Knowledge Graph | Planned | Entity management, relationship mapping, JSON-LD generation |

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — shared with the Frontend
- **Auth:** Supabase Auth (email/password, no public signup)
- **AI:** Anthropic Claude (article writing), OpenAI DALL-E (hero images)
- **Deployment:** Cloudflare Workers via OpenNext

## Getting Started

### Recommended Setup Flow

1. Create one parent folder on your machine called `digital-home`
2. Open that folder in Claude Code
3. In **Chat 1**, paste the Frontend Starter repo and complete the frontend setup first
4. In **Chat 2**, paste this Backend Starter repo and complete the backend setup second
5. Use the **same Supabase project** for both repos

Using a separate chat for each repo helps Claude stay in the correct project context and avoids confusion between frontend and backend files, migrations, and environment variables.

### Prerequisites
- Node.js 22+
- A [Supabase](https://supabase.com) project (same one as your Frontend)
- A [Cloudflare](https://cloudflare.com) account
- API keys: Supabase, Anthropic, OpenAI

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/lukesbrave/digital-home-backend-starter.git
   cd digital-home-backend-starter
   npm install
   ```

   Before continuing, make sure Claude is working inside `digital-home-backend-starter` and using the same Supabase project as the Frontend.

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase credentials, Worker runtime duplicates (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), API keys, and Frontend URL. Leave signed machine requests enabled unless you have a temporary migration reason to disable them.

3. **Create an admin user**
   Go to your Supabase dashboard → Authentication → Users → Add user. There is no public signup — admin users are created directly in Supabase.

4. **Run the migrations in the right order**
   Use the same Supabase project as the Frontend.
   - First run Frontend migrations `001` through `011` from `digital-home-frontend-starter/supabase/migrations/`
   - Then run `supabase/migrations/001_backend_core.sql` from this repo

5. **Update `wrangler.jsonc` before deployment**
   Replace the starter defaults with your own values:
   - `name`
   - `services[0].service`
   - `r2_buckets[0].bucket_name`
   - runtime URLs in `vars`

6. **Run locally**
   ```bash
   npm run dev
   ```

7. **Create the `images` storage bucket (optional, but recommended)**
   The article writer uploads hero images to a Supabase Storage bucket named `images`.
   - In Supabase, go to **Storage**
   - Create a new bucket named `images`
   - Mark it **public** if you want published hero images to load directly on the site
   If you skip this, article writing still works, but hero image generation will quietly fall back to no image.

8. **Deploy to Cloudflare**
   ```bash
   npm run build
   npm run deploy
   ```
   Then set your server-side secrets:
   ```bash
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put API_SECRET_KEY
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put OPENAI_API_KEY
   wrangler secret put DIGITAL_HOME_URL
   ```

### Security Model
- Public visitors should only see published content and active offers from the shared database.
- Backend admin APIs are session-protected.
- Machine-triggered routes (`/api/write-article`, `/api/write-now`, `/api/trend-scan`) accept either a valid admin session or a signed machine request using `x-api-key`, `x-timestamp`, and `x-signature`.
- The service-role key stays server-side only. Public content access is filtered through server code and protected routes, not exposed directly to the browser.
- The GitHub Actions workflows live in the Frontend Starter repo and call these Backend API routes directly.

### Full Documentation
The `CLAUDE.md` file is the complete technical reference — architecture, modules, environment variables, Cloudflare rules, and conventions. Open Claude Code in this repo and it knows everything.

### Fresh-Start Validation
Once both repos are deployed, verify the setup in this order:
- Log into the Backend dashboard successfully
- Open `/api/test-frontend` and confirm it returns `status: 200`
- Run the Frontend repo's `weekly-trends.yml` workflow and confirm new `content_calendar` rows appear
- Approve one topic, then run `daily-publish.yml`
- Confirm the article shows up in the Frontend blog as a draft or published post, depending on your publish mode

## Community

The Digital Home is built and maintained by [BraveBrand](https://bravebrand.co). The code is free and open-source — clone it, deploy it, make it yours.

The part the code can't fully give you is the **brand intelligence** that makes it work at a high level: the content corpus process, brand context inputs, and the deeper strategy behind what to feed your agents so they sound like you instead of generic AI. If you want help with that part, the [BraveBrand community on Skool](https://www.skool.com/bravebrand/about) is where we teach the deeper workflow and support people building their own Digital Homes.

## Related

- [Digital Home Frontend](https://github.com/lukesbrave/digital-home-frontend-starter) — the public-facing storefront
- [CLAUDE.md](./CLAUDE.md) — full technical documentation

## License

MIT — see [LICENSE](./LICENSE)
