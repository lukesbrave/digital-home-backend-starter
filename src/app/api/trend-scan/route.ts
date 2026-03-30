import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateSessionOrApiKey, unauthorizedResponse } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type TrendScanConfig = {
  domains: string[];
  keyword_clusters: string[];
  audience_description: string;
  include_terms: string[];
  exclude_terms: string[];
  max_new_entries: number;
  max_headlines_per_domain: number;
  locale: string;
  country: string;
};

type TrendItem = {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  domain: string;
  query: string;
};

type CandidateEntry = {
  title: string;
  search_query: string;
  target_keyword: string;
  keyword_cluster: string;
  intent_type: string;
  priority: string;
  pillar_topic: string | null;
  notes: string | null;
};

const DEFAULT_CONFIG: TrendScanConfig = {
  domains: [
    "content marketing",
    "brand strategy",
    "marketing automation",
    "creator economy",
    "AI tools for business",
  ],
  keyword_clusters: ["authority", "seo", "ai", "growth", "offers", "emerging"],
  audience_description:
    "Founders, consultants, and service businesses using content to build authority and attract clients.",
  include_terms: ["2026", "strategy", "tool", "trend"],
  exclude_terms: ["stocks", "sports", "celebrity", "politics"],
  max_new_entries: 10,
  max_headlines_per_domain: 5,
  locale: "en-US",
  country: "US",
};

const ALLOWED_INTENT_TYPES = new Set<
  NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["intent_type"]>
>([
  "how_to",
  "comparison",
  "definition",
  "informational",
  "commercial",
  "transactional",
  "listicle",
  "case_study",
  "opinion",
]);

const ALLOWED_PRIORITIES = new Set<
  NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["priority"]>
>(["high", "medium", "low"]);

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeIntentType(
  value: string | null | undefined
): NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["intent_type"]> {
  return value && ALLOWED_INTENT_TYPES.has(value as never)
    ? (value as NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["intent_type"]>)
    : "informational";
}

function sanitizePriority(
  value: string | null | undefined
): NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["priority"]> {
  return value && ALLOWED_PRIORITIES.has(value as never)
    ? (value as NonNullable<Database["public"]["Tables"]["content_calendar"]["Insert"]["priority"]>)
    : "medium";
}

function looksLikeDuplicate(candidate: CandidateEntry, existing: Set<string>): boolean {
  const fields = [
    normalize(candidate.title),
    normalize(candidate.search_query),
    normalize(candidate.target_keyword),
  ].filter(Boolean);

  return fields.some((field) => {
    if (!field) return false;
    if (existing.has(field)) return true;

    for (const seen of existing) {
      if (!seen) continue;
      if (field.includes(seen) || seen.includes(field)) return true;
    }

    return false;
  });
}

async function fetchTrendFeed(query: string, config: TrendScanConfig): Promise<TrendItem[]> {
  const params = new URLSearchParams({
    q: `${query} ${config.include_terms.join(" ")} when:7d`,
    hl: config.locale,
    gl: config.country,
    ceid: `${config.country}:${config.locale.split("-")[0]}`,
  });

  const url = `https://news.google.com/rss/search?${params.toString()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.slice(0, config.max_headlines_per_domain).map((match) => {
    const block = match[1];
    const pick = (tag: string) =>
      decodeHtml(block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "");

    return {
      title: pick("title"),
      link: pick("link"),
      description: pick("description"),
      publishedAt: pick("pubDate"),
      domain: query,
      query,
    };
  });
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }

  return trimmed.slice(start, end + 1);
}

async function loadTrendScanConfig() {
  const supabase = createAdminClient();
  const [{ data: configRow }, { data: publishModeRow }] = await Promise.all([
    supabase.from("backend_settings").select("value").eq("key", "trend_scan_config").maybeSingle(),
    supabase.from("backend_settings").select("value").eq("key", "publish_mode").maybeSingle(),
  ]);

  const configValue =
    configRow?.value && typeof configRow.value === "object" && !Array.isArray(configRow.value)
      ? (configRow.value as Partial<TrendScanConfig>)
      : {};

  const publishMode =
    publishModeRow?.value === "autonomous" ? "autonomous" : "safe";

  return {
    config: {
      ...DEFAULT_CONFIG,
      ...configValue,
      domains:
        Array.isArray(configValue.domains) && configValue.domains.length > 0
          ? configValue.domains.filter(Boolean)
          : DEFAULT_CONFIG.domains,
      keyword_clusters:
        Array.isArray(configValue.keyword_clusters) && configValue.keyword_clusters.length > 0
          ? configValue.keyword_clusters.filter(Boolean)
          : DEFAULT_CONFIG.keyword_clusters,
      include_terms:
        Array.isArray(configValue.include_terms) && configValue.include_terms.length > 0
          ? configValue.include_terms.filter(Boolean)
          : DEFAULT_CONFIG.include_terms,
      exclude_terms:
        Array.isArray(configValue.exclude_terms) && configValue.exclude_terms.length > 0
          ? configValue.exclude_terms.filter(Boolean)
          : DEFAULT_CONFIG.exclude_terms,
    },
    publishMode,
  };
}

export async function POST(request: NextRequest) {
  const auth = await authenticateSessionOrApiKey(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const triggerSource =
    auth.mode === "api-key"
      ? { auth_mode: "api-key", triggered_by: auth.agent }
      : { auth_mode: "session", triggered_by: auth.userId };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured on the backend." },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { config, publishMode } = await loadTrendScanConfig();

  const overrideDomains: string[] =
    Array.isArray(body.domains) && body.domains.length > 0
      ? body.domains.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : config.domains;
  const maxNewEntries =
    typeof body.max_new_entries === "number" && body.max_new_entries > 0
      ? Math.min(body.max_new_entries, 20)
      : config.max_new_entries;

  const feedBatches = await Promise.all(
    overrideDomains.map(async (domain: string) => fetchTrendFeed(domain, config))
  );
  const trendItems = feedBatches.flat().filter((item) => item.title && item.link);

  if (trendItems.length === 0) {
    return NextResponse.json(
      { error: "No trend sources returned usable headlines." },
      { status: 502 }
    );
  }

  const { data: existingEntries } = await supabase
    .from("content_calendar")
    .select("title, search_query, target_keyword")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(250);

  const existingKeys = new Set<string>();
  for (const entry of existingEntries || []) {
    existingKeys.add(normalize(entry.title));
    existingKeys.add(normalize(entry.search_query));
    existingKeys.add(normalize(entry.target_keyword));
  }

  const anthropic = new Anthropic();
  const runId = `TRENDS-${new Date().toISOString().slice(0, 10)}`;
  const targetStatus: NonNullable<
    Database["public"]["Tables"]["content_calendar"]["Insert"]["status"]
  > = publishMode === "autonomous" ? "approved" : "planned";

  const promptPayload = trendItems.slice(0, 30).map((item, index) => ({
    index: index + 1,
    domain: item.domain,
    title: item.title,
    description: item.description,
    publishedAt: item.publishedAt,
    link: item.link,
  }));

  const systemPrompt = `You are a trend scanner for a business content system.

Your job is to turn recent headlines into article opportunities for a small business website.

Rules:
- Focus on practical, article-worthy topics a founder, consultant, or service business could target.
- Avoid generic news rewrites.
- Prefer ideas with a clear search angle.
- Match keyword clusters where possible. Use "emerging" if none fit.
- Return ONLY valid JSON.
- Output shape:
{
  "entries": [
    {
      "title": "string",
      "search_query": "string",
      "target_keyword": "string",
      "keyword_cluster": "string",
      "intent_type": "how_to|comparison|definition|informational|commercial|transactional|listicle|case_study|opinion",
      "priority": "high|medium|low",
      "pillar_topic": "string or null",
      "notes": "short summary of why this topic matters"
    }
  ]
}`;

  const userPrompt = `Audience:
${config.audience_description}

Allowed keyword clusters:
${config.keyword_clusters.join(", ")}

Avoid topics about:
${config.exclude_terms.join(", ")}

Create up to ${maxNewEntries} new content calendar entries from these recent trend headlines:
${JSON.stringify(promptPayload, null, 2)}`;

  const completion = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    completion.content[0]?.type === "text" ? completion.content[0].text : "";

  let parsed: { entries?: CandidateEntry[] };
  try {
    parsed = JSON.parse(extractJsonObject(responseText)) as { entries?: CandidateEntry[] };
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to parse trend scan response: ${error.message}`
            : "Failed to parse trend scan response.",
      },
      { status: 500 }
    );
  }

  const candidates = Array.isArray(parsed.entries) ? parsed.entries : [];
  const deduped: CandidateEntry[] = [];
  let duplicatesSkipped = 0;

  for (const entry of candidates) {
    if (!entry.title || !entry.search_query || !entry.target_keyword) continue;
    if (looksLikeDuplicate(entry, existingKeys)) {
      duplicatesSkipped++;
      continue;
    }

    deduped.push(entry);
    existingKeys.add(normalize(entry.title));
    existingKeys.add(normalize(entry.search_query));
    existingKeys.add(normalize(entry.target_keyword));
  }

  if (deduped.length > 0) {
    const rows: Database["public"]["Tables"]["content_calendar"]["Insert"][] = deduped.map((entry) => ({
      title: entry.title,
      search_query: entry.search_query,
      target_keyword: entry.target_keyword,
      keyword_cluster: entry.keyword_cluster || "emerging",
      intent_type: sanitizeIntentType(entry.intent_type),
      priority: sanitizePriority(entry.priority),
      status: targetStatus,
      pillar_topic: entry.pillar_topic || null,
      run_id: runId,
      created_by: "content_agent",
      notes: entry.notes || null,
    }));

    const { error } = await supabase.from("content_calendar").insert(rows);
    if (error) {
      return NextResponse.json(
        { error: `Failed to save trend scan entries: ${error.message}` },
        { status: 500 }
      );
    }
  }

  await supabase.from("agent_logs").insert({
    agent: "content_agent",
    action: "trend_scan",
    description: `Weekly trend scan completed: ${deduped.length} entries added`,
    status: "completed",
    target_table: "content_calendar",
    input_data: {
      ...triggerSource,
      domains: overrideDomains,
      max_new_entries: maxNewEntries,
    } as Json,
    output_data: {
      run_id: runId,
      trends_found: trendItems.length,
      new_entries: deduped.length,
      duplicates_skipped: duplicatesSkipped,
      publish_mode: publishMode,
    } as Json,
  });

  return NextResponse.json({
    success: true,
    run_id: runId,
    publish_mode: publishMode,
    target_status: targetStatus,
    trends_found: trendItems.length,
    new_entries: deduped.length,
    duplicates_skipped: duplicatesSkipped,
    entries: deduped,
    config_used: {
      domains: overrideDomains,
      keyword_clusters: config.keyword_clusters,
      max_new_entries: maxNewEntries,
    },
  });
}
