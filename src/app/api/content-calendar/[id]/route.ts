import { NextRequest, NextResponse } from "next/server";
import { authenticateSession, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ["approved", "archived"],
  approved: ["planned", "writing", "archived"],
  writing: ["approved", "draft", "published", "archived"],
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["planned"],
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await authenticateSession(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  const allowedFields = [
    "title",
    "search_query",
    "target_keyword",
    "keyword_cluster",
    "intent_type",
    "priority",
    "status",
    "pillar_topic",
    "topic_cluster",
    "scheduled_publish_date",
    "content_object_id",
    "seo_meta_id",
    "run_id",
    "notes",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (typeof update.status === "string") {
    const { data: current } = await supabase
      .from("content_calendar")
      .select("status")
      .eq("id", id)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Calendar entry not found" }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[current.status] || [];
    if (!allowed.includes(update.status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${current.status}' to '${update.status}'`,
        },
        { status: 422 }
      );
    }
  }

  const { data, error } = await supabase
    .from("content_calendar")
    .update(update)
    .eq("id", id)
    .select("*, content_objects:content_object_id(slug, status, published_at)")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Calendar entry not found" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json(data);
}
