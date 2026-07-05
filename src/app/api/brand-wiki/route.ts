/**
 * GET /api/brand-wiki — List all Brand Wiki entries (metadata only, no content).
 *
 * Returns articles, sources, and documents so the dashboard can render the
 * lists without shipping ~800KB of markdown. Full content is loaded per-item
 * from /api/brand-wiki/[slug].
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateSessionOrApiKey, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateSessionOrApiKey(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const supabase = createAdminClient();

  const [articles, sources, documents] = await Promise.all([
    supabase
      .from("brand_wiki_articles")
      .select("slug, category, title, status, summary, last_updated, source_refs, file_path")
      .order("category", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("brand_wiki_sources")
      .select("slug, title, description, business, file_type, captured_date, file_path")
      .order("title", { ascending: true }),
    supabase
      .from("brand_wiki_documents")
      .select("slug, doc_type, title, file_path")
      .order("doc_type", { ascending: true }),
  ]);

  const firstError = articles.error || sources.error || documents.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: articles.data || [],
    sources: sources.data || [],
    documents: documents.data || [],
  });
}
