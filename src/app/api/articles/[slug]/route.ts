/**
 * GET /api/articles/[slug] — Fetch a single article
 * PATCH /api/articles/[slug] — Update an article
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_objects")
    .select("*, seo_meta(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  // Separate SEO fields from content fields
  const { seo, ...contentFields } = body;

  // If publishing, set published_at
  if (contentFields.status === "published" && !contentFields.published_at) {
    contentFields.published_at = new Date().toISOString();
  }

  // Update content object
  const { data: article, error: contentError } = await supabase
    .from("content_objects")
    .update(contentFields)
    .eq("slug", slug)
    .select("*, seo_meta(*)")
    .single();

  if (contentError || !article) {
    return NextResponse.json(
      { error: `Update failed: ${contentError?.message || "not found"}` },
      { status: contentError ? 500 : 404 }
    );
  }

  // Sync calendar entry status when article status changes
  if (contentFields.status) {
    await supabase
      .from("content_calendar")
      .update({ status: contentFields.status })
      .eq("content_object_id", article.id);
  }

  // Update SEO meta if provided
  if (seo && article.seo_meta_id) {
    await supabase
      .from("seo_meta")
      .update(seo)
      .eq("id", article.seo_meta_id);

    // Re-fetch with updated seo_meta
    const { data: updated } = await supabase
      .from("content_objects")
      .select("*, seo_meta(*)")
      .eq("slug", slug)
      .single();

    if (updated) {
      return NextResponse.json(updated);
    }
  }

  return NextResponse.json(article);
}
