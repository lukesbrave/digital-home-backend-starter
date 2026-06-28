import { NextRequest, NextResponse } from "next/server";
import { authenticateSessionOrApiKey, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export async function GET(request: NextRequest) {
  const auth = await authenticateSessionOrApiKey(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") || "200", 10))
  );
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();
  let query = supabase
    .from("content_calendar")
    .select("*, content_objects:content_object_id(slug, status, published_at)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  if (status) query = query.eq("status", status as never);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to load calendar" }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}

/**
 * POST /api/content-calendar — Create calendar entries.
 *
 * Accepts a single entry object or a batch: { entries: [ ... ] }.
 * Auth: operator session OR machine `x-api-key` (see lib/api/auth). Agents are
 * tagged `created_by: "content_agent"`; the content-strategy run uses this to
 * seed the pipeline. The unique (search_query, target_keyword) index makes
 * re-runs safe — a duplicate batch returns 409 rather than double-inserting.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateSessionOrApiKey(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const entries: Record<string, unknown>[] = Array.isArray(body.entries)
    ? body.entries
    : [body];

  if (entries.length === 0) {
    return NextResponse.json({ error: "At least one entry is required" }, { status: 400 });
  }
  if (entries.some((e) => !e.title)) {
    return NextResponse.json({ error: "Each entry must have a title" }, { status: 400 });
  }

  const defaultCreator = auth.mode === "api-key" ? "content_agent" : "human";

  const rows = entries.map((e) => ({
    title: e.title as string,
    search_query: (e.search_query as string | undefined) ?? null,
    target_keyword: (e.target_keyword as string | undefined) ?? null,
    keyword_cluster: (e.keyword_cluster as string | undefined) ?? null,
    intent_type: (e.intent_type as Enums<"intent_type"> | undefined) ?? "informational",
    priority: (e.priority as Enums<"calendar_priority"> | undefined) ?? "medium",
    status: (e.status as Enums<"calendar_status"> | undefined) ?? "planned",
    pillar_topic: (e.pillar_topic as string | undefined) ?? null,
    topic_cluster: (e.topic_cluster as string | undefined) ?? null,
    scheduled_publish_date: (e.scheduled_publish_date as string | undefined) ?? null,
    run_id: (e.run_id as string | undefined) ?? null,
    created_by: (e.created_by as string | undefined) ?? defaultCreator,
    notes: (e.notes as string | undefined) ?? null,
  }));

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("content_calendar").insert(rows).select();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Duplicate: a calendar entry with that search_query + target_keyword already exists",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] }, { status: 201 });
}
