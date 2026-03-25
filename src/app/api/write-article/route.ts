/**
 * POST /api/write-article — AI-powered article writer
 *
 * Takes a calendar_entry_id, calls Claude to write the full article,
 * saves it to content_objects via the Frontend API, and updates the
 * calendar entry status.
 *
 * Respects publish mode:
 * - safe: article saved as "draft" for review
 * - autonomous: article saved as "published" directly
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { join } from "path";

const FRONTEND_URL =
  process.env.DIGITAL_HOME_URL || "http://localhost:3000";
const API_KEY = process.env.API_SECRET_KEY || "";

// ─── Brand context loader ────────────────────────────────────────────────────

// Priority: database first, filesystem fallback (local dev)
async function loadBrandContext(): Promise<string> {
  const supabase = createAdminClient();

  // Try database first (production-ready)
  const { data: dbContext } = await supabase
    .from("brand_context")
    .select("key, category, content")
    .order("category");

  if (dbContext && dbContext.length > 0) {
    return dbContext
      .map((row) => `# ${row.category}/${row.key}\n\n${row.content}`)
      .join("\n\n---\n\n");
  }

  // Fallback: read from filesystem (local development)
  const corpusRoot = join(process.cwd(), "..", "Digital Home 2.0", "content-corpus");
  const files = [
    { label: "Brand Voice Guide", path: "voice/voice-guide.md" },
    { label: "Banned Phrases", path: "voice/banned-phrases.md" },
    { label: "Core Positioning", path: "positioning/core-positioning.md" },
    { label: "Offer Architecture", path: "positioning/offers.md" },
    { label: "SEO Keyword Clusters", path: "seo/keyword-clusters.md" },
  ];

  const sections: string[] = [];
  for (const file of files) {
    try {
      const content = await readFile(join(corpusRoot, file.path), "utf-8");
      if (content) sections.push(`# ${file.label}\n\n${content}`);
    } catch {
      // File not found — skip
    }
  }

  return sections.join("\n\n---\n\n");
}

// ─── Fetch existing articles for internal linking ────────────────────────────

async function fetchPublishedSlugs(): Promise<
  { slug: string; title: string }[]
> {
  try {
    const res = await fetch(
      `${FRONTEND_URL}/api/content?status=published&limit=20`,
      { headers: { "x-api-key": API_KEY } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || data.content || []).map(
      (a: { slug: string; title: string }) => ({
        slug: a.slug,
        title: a.title,
      })
    );
  } catch {
    return [];
  }
}

// ─── Hero image generation ───────────────────────────────────────────────────

async function generateHeroImage(
  title: string,
  keyword: string,
  slug: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const openai = new OpenAI();

    const imagePrompt = `Create a minimal, abstract editorial hero image for a blog article titled "${title}".
Dark background (#000000 to #0a0a0a). Subtle geometric shapes, flowing lines, or abstract forms in muted emerald green and white tones.
The mood should be sophisticated, premium, and tech-forward. No text, no words, no letters, no people, no faces.
Think: editorial design meets abstract art. Clean, minimal, high-end.
Topic context: ${keyword}`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) return null;

    // Download the image and upload to Supabase Storage
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;
    const imageBuffer = await imageRes.arrayBuffer();

    const supabase = createAdminClient();
    const fileName = `blog/${slug}-hero.png`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Image upload failed:", uploadError.message);
      return null;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (err) {
    console.error("Hero image generation failed:", err);
    return null;
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { calendar_entry_id } = body;

  if (!calendar_entry_id) {
    return NextResponse.json(
      { error: "calendar_entry_id is required" },
      { status: 400 }
    );
  }

  // Check for Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY not configured. Add it to .env.local to enable AI writing.",
      },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();

  // 1. Fetch the calendar entry
  const { data: entry, error: entryError } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("id", calendar_entry_id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json(
      { error: "Calendar entry not found" },
      { status: 404 }
    );
  }

  // 2. Get publish mode from settings
  const { data: settingsData } = await supabase
    .from("backend_settings")
    .select("value")
    .eq("key", "publish_mode")
    .single();

  const publishMode = settingsData?.value === "autonomous" ? "autonomous" : "safe";
  const targetStatus = publishMode === "autonomous" ? "published" : "draft";

  // 3. Mark as writing
  await supabase
    .from("content_calendar")
    .update({ status: "writing" })
    .eq("id", calendar_entry_id);

  try {
    // 4. Load brand context and existing articles
    const [brandContext, publishedArticles] = await Promise.all([
      loadBrandContext(),
      fetchPublishedSlugs(),
    ]);

    const internalLinks = publishedArticles.length > 0
      ? `\n\nExisting articles for internal linking:\n${publishedArticles
          .map((a) => `- /blog/${a.slug} — "${a.title}"`)
          .join("\n")}`
      : "";

    // 5. Call Claude to write the article
    const anthropic = new Anthropic();

    const systemPrompt = `You are the BraveBrand Content Agent. You write articles optimized for human readers and AI systems.

${brandContext}
${internalLinks}

IMPORTANT RULES:
- Write in the BraveBrand voice: Clay Christensen's structured storytelling meets Antonio García Martínez's provocative irreverence
- Reading level: 9th grade. Short sentences. Plain words.
- Follow the banned phrases list strictly
- Article length: 1,200-2,500 words
- Output ONLY valid JSON — no markdown code fences, no commentary`;

    const userPrompt = `Write a full article for this topic:

Title: ${entry.title}
Target keyword: ${entry.target_keyword || "not specified"}
Keyword cluster: ${entry.keyword_cluster || "not specified"}
Intent type: ${entry.intent_type || "informational"}
Priority: ${entry.priority || "medium"}

Follow this structure:
1. Hook — provocative statement, vivid anecdote, or counterintuitive claim
2. Problem — name the specific pain the audience feels
3. Failed solutions — why what they've tried hasn't worked
4. The reframe — shift their perspective on the real problem
5. The framework/solution — present the systematic approach
6. Proof — reference relevant case studies or testimonials from the brand context
7. CTA — tie to one of BraveBrand's offers (matched by topic relevance)

SEO requirements:
- Integrate target keyword 3-5 times naturally
- Use descriptive H2 headings (2-3 as direct questions)
- Include the target keyword in the first paragraph and one H2
- Include 2-3 internal links to existing articles where relevant (use <a href="/blog/slug">text</a>)

FAQ section:
- After the CTA, add an FAQ section with 4-6 questions and answers
- Questions should be ones a reader would naturally ask after reading the article
- Answers should be 2-3 sentences each, direct and helpful
- Include the target keyword naturally in at least 2 FAQ answers
- Format as HTML: <h2>Frequently Asked Questions</h2> followed by <h3>question</h3><p>answer</p> pairs
- Also return the FAQs as structured data in the "faqs" field for JSON-LD schema

Return a JSON object with EXACTLY these fields:
{
  "title": "article title",
  "slug": "url-safe-slug",
  "body": "full HTML article body including FAQ section at the end",
  "excerpt": "150-200 character excerpt",
  "semantic_tags": ["tag1", "tag2", "tag3"],
  "target_segments": ["segment1"],
  "content_type": "article",
  "faqs": [{"question": "Q1?", "answer": "A1"}, {"question": "Q2?", "answer": "A2"}],
  "seo": {
    "title": "SEO meta title under 60 chars",
    "description": "meta description under 160 chars",
    "target_keyword": "primary keyword",
    "secondary_keywords": ["kw1", "kw2", "kw3"],
    "keyword_cluster": "cluster name",
    "schema_type": "Article"
  }
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    // 6. Parse the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle potential markdown wrapping)
    let articleData: {
      title: string;
      slug: string;
      body: string;
      excerpt: string;
      semantic_tags: string[];
      target_segments: string[];
      content_type: string;
      faqs?: { question: string; answer: string }[];
      seo: {
        title: string;
        description: string;
        target_keyword: string;
        secondary_keywords: string[];
        keyword_cluster: string;
        schema_type: string;
      };
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      articleData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Revert status
      await supabase
        .from("content_calendar")
        .update({ status: "approved" })
        .eq("id", calendar_entry_id);
      return NextResponse.json(
        {
          error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "unknown"}`,
        },
        { status: 500 }
      );
    }

    // 7. Generate hero image (non-blocking — article still saves if this fails)
    const heroImageUrl = await generateHeroImage(
      articleData.title,
      entry.target_keyword || articleData.semantic_tags?.[0] || "business technology",
      articleData.slug
    );

    // 8. Save via Frontend API
    const publishPayload = {
      slug: articleData.slug,
      title: articleData.title,
      body: articleData.body,
      excerpt: articleData.excerpt,
      content_type: articleData.content_type || "article",
      semantic_tags: articleData.semantic_tags || [],
      target_segments: articleData.target_segments || [],
      featured_image_url: heroImageUrl,
      status: targetStatus,
      created_by: "content_agent",
      author_name: "Luke Carter",
      seo: {
        ...articleData.seo,
        og_image_url: heroImageUrl,
        // Include FAQs in SEO meta for FAQPage JSON-LD schema
        ...(articleData.faqs?.length ? { faqs: articleData.faqs } : {}),
      },
    };

    let articleResult: { id?: string; slug?: string } | null = null;

    const publishRes = await fetch(`${FRONTEND_URL}/api/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(publishPayload),
    });

    if (!publishRes.ok) {
      // Try with modified slug if duplicate
      const errData = await publishRes.json().catch(() => ({}));
      if (
        publishRes.status === 409 ||
        (errData.error && errData.error.includes("duplicate"))
      ) {
        publishPayload.slug = `${articleData.slug}-${Date.now().toString(36).slice(-4)}`;
        const retryRes = await fetch(`${FRONTEND_URL}/api/content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(publishPayload),
        });
        if (retryRes.ok) {
          articleResult = await retryRes.json();
        }
      }

      if (!articleResult) {
        // Revert status
        await supabase
          .from("content_calendar")
          .update({ status: "approved" })
          .eq("id", calendar_entry_id);
        return NextResponse.json(
          { error: "Failed to save article via Frontend API" },
          { status: 500 }
        );
      }
    } else {
      articleResult = await publishRes.json();
    }

    // 8. Update calendar entry
    await supabase
      .from("content_calendar")
      .update({
        status: targetStatus,
        content_object_id: articleResult?.id || null,
      })
      .eq("id", calendar_entry_id);

    // 9. Log the action (non-blocking)
    fetch(`${FRONTEND_URL}/api/agent-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        agent: "content_agent",
        action: "write_article",
        description: `Wrote article: ${articleData.title}`,
        status: "completed",
        target_table: "content_objects",
        target_id: articleResult?.id,
        output_data: {
          title: articleData.title,
          slug: publishPayload.slug,
          word_count: articleData.body.split(/\s+/).length,
          publishing_mode: publishMode,
          calendar_id: calendar_entry_id,
        },
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      article: {
        title: articleData.title,
        slug: publishPayload.slug,
        status: targetStatus,
        word_count: articleData.body.split(/\s+/).length,
      },
      mode: publishMode,
    });
  } catch (error) {
    // Revert calendar status on any failure
    await supabase
      .from("content_calendar")
      .update({ status: "approved" })
      .eq("id", calendar_entry_id);

    return NextResponse.json(
      {
        error: `Article writing failed: ${error instanceof Error ? error.message : "unknown error"}`,
      },
      { status: 500 }
    );
  }
}
