# Digital Home Backend

The operating system behind a Digital Home — an open-source backend that manages content, leads, email, analytics, and AI agents. A single, owned, agent-native system — no platform lock-in, no monthly SaaS fees for features you could own.

This is the **Backend** (the operating system). Behind every [Digital Home Frontend](https://github.com/lukesbrave/digital-home-frontend) (the public-facing website), this Backend handles everything that happens behind the scenes. Both share the same Supabase database.

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

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — shared with the Frontend
- **Auth:** Supabase Auth (email/password, no public signup)
- **AI:** Anthropic Claude (article writing), OpenAI DALL-E (hero images)
- **Deployment:** Cloudflare Workers via OpenNext

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (same one as your Frontend)
- A [Cloudflare](https://cloudflare.com) account
- API keys: Supabase, Anthropic, OpenAI

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/lukesbrave/digital-home-backend.git
   cd digital-home-backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase credentials, API keys, and Frontend URL.

3. **Create an admin user**
   Go to your Supabase dashboard → Authentication → Users → Add user. There is no public signup — admin users are created directly in Supabase.

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Deploy to Cloudflare**
   ```bash
   npm run build
   npx wrangler deploy
   ```
   Then set your server-side secrets:
   ```bash
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put API_SECRET_KEY
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put OPENAI_API_KEY
   wrangler secret put DIGITAL_HOME_URL
   ```

### Full Documentation
The `CLAUDE.md` file is the complete technical reference — architecture, modules, environment variables, Cloudflare rules, and conventions. Open Claude Code in this repo and it knows everything.

## Related

- [Digital Home Frontend](https://github.com/lukesbrave/digital-home-frontend) — the public-facing storefront
- [CLAUDE.md](./CLAUDE.md) — full technical documentation

## License

MIT — see [LICENSE](./LICENSE)
