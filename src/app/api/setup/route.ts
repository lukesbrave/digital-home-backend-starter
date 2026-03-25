/**
 * POST /api/setup — One-time setup: creates required tables and seeds brand context
 *
 * Creates:
 * - brand_context table (stores brand voice, positioning, offers, etc.)
 * - backend_settings table (stores publish mode and other settings)
 *
 * Then seeds brand context from filesystem (content-corpus directory) if available,
 * or accepts brand context in the request body.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { readFile } from "fs/promises";
import { join } from "path";

const CORPUS_FILES: { key: string; category: string; path: string }[] = [
  { key: "voice-guide", category: "voice", path: "voice/voice-guide.md" },
  { key: "tone-examples", category: "voice", path: "voice/tone-examples.md" },
  { key: "banned-phrases", category: "voice", path: "voice/banned-phrases.md" },
  { key: "content-hooks", category: "voice", path: "voice/content-hooks.md" },
  { key: "core-positioning", category: "positioning", path: "positioning/core-positioning.md" },
  { key: "offers", category: "positioning", path: "positioning/offers.md" },
  { key: "competitive-landscape", category: "positioning", path: "positioning/competitive-landscape.md" },
  { key: "keyword-clusters", category: "seo", path: "seo/keyword-clusters.md" },
  { key: "case-studies", category: "proof", path: "proof/case-studies.md" },
  { key: "testimonials", category: "proof", path: "proof/testimonials.md" },
];

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // 1. Create tables via raw SQL using Supabase's pg_net or admin functions
  // Since we can't run raw SQL via the client, we'll use upsert which auto-creates
  // if the table exists. If tables don't exist, the user needs to create them in Supabase dashboard.

  // Test if tables exist
  const { error: testError } = await supabase
    .from("brand_context")
    .select("key")
    .limit(1);

  if (testError?.message?.includes("not found") || testError?.message?.includes("does not exist")) {
    return NextResponse.json(
      {
        error: "Tables not created yet. Run these SQL commands in Supabase Dashboard → SQL Editor:",
        sql: `
CREATE TABLE IF NOT EXISTS brand_context (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backend_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role full access
ALTER TABLE brand_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON brand_context FOR ALL USING (true);

ALTER TABLE backend_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON backend_settings FOR ALL USING (true);
        `.trim(),
      },
      { status: 400 }
    );
  }

  // 2. Try to seed from filesystem (local development with Frontend repo nearby)
  const corpusRoot = join(process.cwd(), "..", "Digital Home 2.0", "content-corpus");
  let seededCount = 0;

  for (const file of CORPUS_FILES) {
    try {
      const content = await readFile(join(corpusRoot, file.path), "utf-8");
      if (content) {
        await supabase.from("brand_context").upsert(
          {
            key: file.key,
            category: file.category,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        seededCount++;
      }
    } catch {
      // File not found — skip (expected in production)
    }
  }

  // 3. Check if brand context was provided in request body
  const body = await request.json().catch(() => ({}));
  if (body.brand_context && Array.isArray(body.brand_context)) {
    for (const item of body.brand_context) {
      if (item.key && item.category && item.content) {
        await supabase.from("brand_context").upsert(
          {
            key: item.key,
            category: item.category,
            content: item.content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        seededCount++;
      }
    }
  }

  // 4. Report what was seeded
  const { data: allContext } = await supabase
    .from("brand_context")
    .select("key, category");

  return NextResponse.json({
    success: true,
    seeded: seededCount,
    total: allContext?.length || 0,
    files: allContext?.map((c) => `${c.category}/${c.key}`) || [],
  });
}
