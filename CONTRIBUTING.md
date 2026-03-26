# Contributing to Digital Home Backend

Thanks for your interest in contributing. This project is designed to be set up and maintained with Claude Code — the `CLAUDE.md` file is the complete technical reference.

## Getting Started

1. Fork the repo
2. Clone your fork and run `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your credentials
4. Run `npm run dev` to start locally
5. Create an admin user in your Supabase dashboard (Authentication > Users > Add user)

## Development Workflow

- Open the project in Claude Code — it reads `CLAUDE.md` and understands the full architecture
- Always run `npm run build` before pushing (catches TypeScript errors that `next dev` misses)
- This project runs on Cloudflare Workers via OpenNext — see the Cloudflare rules in `CLAUDE.md`

## Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Make sure the build passes: `npm run build`
- Don't commit `.env` files or secrets

## Important

- The Backend shares a database with the Frontend — if you modify `src/types/database.ts`, the same change must be made in the Frontend repo
- Server-side secrets must be set via `wrangler secret put`, not the Cloudflare dashboard

## Questions?

Open an issue. The `CLAUDE.md` file answers most technical questions — read it first.
