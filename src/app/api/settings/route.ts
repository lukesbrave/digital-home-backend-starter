/**
 * GET/POST /api/settings — Read/write backend settings
 *
 * Uses a simple key-value approach in the backend_settings table.
 * Primary use: storing publish_mode (safe/autonomous) so the
 * /write-article Claude Code skill can read it.
 *
 * If the backend_settings table doesn't exist yet, falls back to
 * returning defaults. The table can be created with:
 *
 * CREATE TABLE backend_settings (
 *   key TEXT PRIMARY KEY,
 *   value JSONB NOT NULL,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";


const DEFAULTS: Record<string, unknown> = {
  publish_mode: "safe",
};

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("backend_settings")
    .select("key, value");

  if (error) {
    // Table might not exist yet — return defaults
    return NextResponse.json({ settings: DEFAULTS });
  }

  const settings: Record<string, unknown> = { ...DEFAULTS };
  for (const row of data || []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("backend_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    // Table might not exist — try to create it
    if (error.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "backend_settings table not found. Create it in Supabase: CREATE TABLE backend_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: `Failed to save setting: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, key, value });
}
