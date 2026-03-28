/**
 * POST /api/setup — One-time setup: seeds brand context into database
 *
 * Accepts brand context in the request body as an array of { key, category, content }.
 * Validates that required tables exist and reports what was seeded.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  const auth = await authenticateSession(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const supabase = createAdminClient();

  // 1. Test if tables exist
  const { error: testError } = await supabase
    .from("brand_context")
    .select("key")
    .limit(1);

  if (testError?.message?.includes("not found") || testError?.message?.includes("does not exist")) {
    return NextResponse.json(
      {
        error:
          "Tables not created yet. Run the checked-in backend Supabase migrations before using setup.",
        migration_path: "supabase/migrations/001_backend_core.sql",
      },
      { status: 400 }
    );
  }

  // 2. Seed from request body
  let seededCount = 0;
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

  // 3. Report what exists
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
