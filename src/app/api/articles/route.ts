/**
 * GET /api/articles — List all articles (content_objects)
 *
 * Query params:
 *   ?status=draft|published|archived
 *   ?search=keyword
 *   ?page=1&limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();
  let query = supabase
    .from("content_objects")
    .select("*, seo_meta(*)", { count: "exact" });

  // Filter by status
  const status = searchParams.get("status");
  if (status) {
    query = query.eq("status", status as "published" | "draft" | "archived");
  }

  // Search by title
  const search = searchParams.get("search");
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Order and paginate
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data || [],
    total: count || 0,
    page,
    limit,
  });
}
