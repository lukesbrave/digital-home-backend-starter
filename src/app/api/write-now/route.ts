/**
 * POST /api/write-now — Trigger AI article writing for an approved topic
 *
 * Re-exports the write-article handler directly to avoid internal fetch
 * which can fail on Cloudflare Workers.
 */

export { POST } from "../write-article/route";
