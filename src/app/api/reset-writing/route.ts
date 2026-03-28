/**
 * POST /api/reset-writing — Reset stuck "writing" entries back to "approved"
 *
 * When a Cloudflare Worker times out mid-article-generation, the catch block
 * in /api/write-article never runs, leaving entries stuck in "writing" status
 * with no way to escape via the UI drag system. This endpoint resets them.
 *
 * Accepts an optional calendar_entry_id to reset a specific entry,
 * or resets ALL writing entries if none is provided.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await authenticateSession(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const supabase = createAdminClient();

  let body: { calendar_entry_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — we'll reset all
  }

  const query = supabase
    .from("content_calendar")
    .update({ status: "approved" })
    .eq("status", "writing");

  if (body.calendar_entry_id) {
    query.eq("id", body.calendar_entry_id);
  }

  const { error, count } = await query.select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    reset: count ?? 0,
    message: body.calendar_entry_id
      ? "Entry reset to approved"
      : `${count ?? 0} stuck entries reset to approved`,
  });
}
