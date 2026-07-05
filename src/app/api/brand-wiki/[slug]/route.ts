/**
 * GET /api/brand-wiki/[slug]?type=article|source|document
 *
 * Returns a single Brand Wiki entry with its full content. `type` selects the
 * table; it defaults to `article`.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateSessionOrApiKey, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

const TABLES: Record<string, string> = {
  article: "brand_wiki_articles",
  source: "brand_wiki_sources",
  document: "brand_wiki_documents",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await authenticateSessionOrApiKey(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const { slug } = await params;
  const type = request.nextUrl.searchParams.get("type") || "article";
  const table = TABLES[type];
  if (!table) {
    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ entry: data });
}
