/**
 * Seeds test data into Supabase for UI development.
 * Usage: npx tsx --env-file=.env.local scripts/seed-test-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log("Seeding test data...\n");

  // 1. Create content calendar entries at various stages
  const calendarEntries = [
    { title: "Why Owned Infrastructure Beats Another SaaS Subscription", target_keyword: "owned business infrastructure", keyword_cluster: "digital-home", intent_type: "opinion" as const, priority: "high" as const, status: "planned" as const, pillar_topic: "Digital Home", created_by: "content_agent" },
    { title: "How to Build an Authority Engine With AI and Search", target_keyword: "authority building with ai", keyword_cluster: "frameworks", intent_type: "how_to" as const, priority: "high" as const, status: "planned" as const, pillar_topic: "Authority", created_by: "content_agent" },
    { title: "5 Signs Your Marketing Stack Is Holding Back Growth", target_keyword: "marketing stack audit", keyword_cluster: "digital-home", intent_type: "listicle" as const, priority: "medium" as const, status: "planned" as const, pillar_topic: "Operations", created_by: "content_agent" },
    { title: "AI-Native Infrastructure: What It Means for a Small Business", target_keyword: "ai native business infrastructure", keyword_cluster: "ai-strategy", intent_type: "informational" as const, priority: "high" as const, status: "approved" as const, pillar_topic: "AI Strategy", created_by: "content_agent" },
    { title: "How to Replace Tool Sprawl With One Connected System", target_keyword: "replace marketing tool sprawl", keyword_cluster: "digital-home", intent_type: "how_to" as const, priority: "medium" as const, status: "approved" as const, pillar_topic: "Operations", created_by: "content_agent" },
    { title: "Why Quality Still Matters in an Automated Content Workflow", target_keyword: "automated content workflow", keyword_cluster: "content-strategy", intent_type: "opinion" as const, priority: "high" as const, status: "writing" as const, pillar_topic: "Content Strategy", created_by: "content_agent" },
  ];

  const { data: calData, error: calError } = await supabase
    .from("content_calendar")
    .insert(calendarEntries)
    .select();

  if (calError) {
    console.error("Calendar insert failed:", calError.message);
    return;
  }
  console.log(`✓ Inserted ${calData.length} calendar entries`);

  // 2. Create SEO meta for the articles
  const { data: seo1, error: seoErr1 } = await supabase
    .from("seo_meta")
    .insert({
      title: "The Future of AI Agents in Digital Marketing",
      description: "How autonomous AI agents are transforming digital marketing from campaign management to full-stack business operations.",
      target_keyword: "ai agents digital marketing",
      secondary_keywords: ["autonomous marketing", "ai business operations", "marketing automation ai"],
      keyword_cluster: "ai-strategy",
      schema_type: "Article",
    })
    .select("id")
    .single();

  const { data: seo2, error: seoErr2 } = await supabase
    .from("seo_meta")
    .insert({
      title: "Connected System vs Tool Sprawl: Why Owning Your Stack Matters",
      description: "A comparison of running one connected system versus stitching together too many marketing tools and rented platforms.",
      target_keyword: "connected system vs tool sprawl",
      secondary_keywords: ["own your platform", "marketing stack audit", "tool sprawl"],
      keyword_cluster: "digital-home",
      schema_type: "Article",
    })
    .select("id")
    .single();

  if (seoErr1 || seoErr2) {
    console.error("SEO insert failed:", seoErr1?.message || seoErr2?.message);
    return;
  }
  console.log("✓ Inserted 2 SEO meta records");

  // 3. Create content objects (articles)
  const articles = [
    {
      slug: "future-of-ai-agents-in-digital-marketing",
      title: "The Future of AI Agents in Digital Marketing",
      content_type: "article" as const,
      body: `<h2>The Shift Nobody's Talking About</h2>
<p>Every marketer alive is talking about AI. But most of them are talking about the wrong thing. They're talking about ChatGPT writing their LinkedIn posts. About Midjourney making their thumbnails. About automating the things they were already doing badly.</p>
<p>The real shift isn't about making the old playbook faster. It's about a completely new playbook — one where AI agents don't just assist your marketing, they <em>run</em> it.</p>
<h2>What an AI-Native Marketing Stack Looks Like</h2>
<p>Imagine a system where a content agent scans trending topics in your niche every morning, writes and publishes an SEO-optimized article before you've had your coffee, and another agent monitors the performance data to adjust the strategy for tomorrow.</p>
<p>That's not science fiction. More small businesses are building systems like this right now, and the architecture behind them matters more than the AI models themselves.</p>
<h2>The Three Layers</h2>
<p>An AI-native marketing stack has three layers:</p>
<p><strong>1. The Content Layer</strong> — Where articles, case studies, and landing pages live. Not as files in a CMS, but as structured objects in a database with semantic tags, target segments, and associated offers.</p>
<p><strong>2. The Intelligence Layer</strong> — Where agents operate. Content agents write. SEO agents optimize. Analytics agents report. Each one reads from and writes to the same database.</p>
<p><strong>3. The Distribution Layer</strong> — Where content meets audience. Your website, email sequences, social channels. All fed by the same structured content, personalized per visitor segment.</p>
<h2>Why This Matters Now</h2>
<p>The consultants and agencies who build this infrastructure today will have an unfair advantage for the next decade. Not because the AI is smarter — everyone has access to the same models — but because their <em>system</em> compounds.</p>
<p>Every article published trains the system on what works. Every visitor interaction refines the personalization. Every conversion tightens the feedback loop. The longer it runs, the better it gets.</p>
<p>That's the real moat. Not the AI. The architecture.</p>`,
      excerpt: "How autonomous AI agents are transforming digital marketing from campaign management to full-stack business operations.",
      semantic_tags: ["ai-agents", "digital-marketing", "marketing-automation", "ai-native"],
      target_segments: ["new-visitor", "returning-engaged"],
      status: "published" as const,
      created_by: "content_agent" as const,
      author_name: "Alex Morgan",
      published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      seo_meta_id: seo1!.id,
    },
    {
      slug: "connected-system-vs-tool-sprawl",
      title: "Connected System vs Tool Sprawl: Why Owning Your Stack Matters",
      content_type: "article" as const,
      body: `<h2>The Platform Trap</h2>
<p>You're paying for one CRM, three marketing tools, two automation platforms, and a website stack held together by duct tape.</p>
<p>And here's the thing nobody wants to admit: you don't really own any of it. Your funnels, automations, contact data, and email sequences are spread across other companies' servers, governed by other companies' terms of service.</p>
<p>One API change. One price increase. One "strategic pivot" by the platform. And your entire business infrastructure is at risk.</p>
<h2>What a Digital Home Actually Is</h2>
<p>A Digital Home is the opposite of rented infrastructure. It's a self-hosted, fully owned stack that replaces your CRM, your CMS, your email platform, and your analytics dashboard — all running on your own database.</p>
<p>The public website is the storefront. Behind it sits the backend — your private control room for content, leads, email sequences, and AI agent oversight.</p>
<h2>The Comparison</h2>
<p><strong>Tool sprawl</strong> gives you a lot of capabilities, but each one lives in a different system, with a different login, a different pricing model, and a different roadmap.</p>
<p><strong>A connected system</strong> gives you the same capabilities — content management, lead pipelines, email automation, analytics — but you own the code, the data, and the deployment. You can extend it however you want. You can hand it to a client as their own infrastructure.</p>
<h2>The Real Cost</h2>
<p>A Digital Home costs more upfront in time and expertise. But the total cost of ownership over 3 years is lower, and you're building equity instead of paying rent.</p>
<p>More importantly: you can do things a platform can't. AI agents that run autonomously. Personalization engines that adapt per visitor. Knowledge graphs that make your SEO compound over time.</p>
<p>That's the trade. Convenience now, or sovereignty forever.</p>`,
      excerpt: "A comparison of running one connected system versus stitching together too many marketing tools and rented platforms.",
      semantic_tags: ["digital-home", "tool-sprawl", "platform-comparison", "digital-sovereignty"],
      target_segments: ["new-visitor"],
      status: "draft" as const,
      created_by: "content_agent" as const,
      author_name: "Alex Morgan",
      seo_meta_id: seo2!.id,
    },
  ];

  const { data: articleData, error: articleError } = await supabase
    .from("content_objects")
    .insert(articles)
    .select();

  if (articleError) {
    console.error("Article insert failed:", articleError.message);
    return;
  }
  console.log(`✓ Inserted ${articleData.length} articles`);

  // 4. Link articles back to calendar entries
  // Add a "draft" calendar entry linked to the draft article
  const { error: draftCalErr } = await supabase
    .from("content_calendar")
    .insert({
      title: "Connected System vs Tool Sprawl: Why Owning Your Stack Matters",
      target_keyword: "connected system vs tool sprawl",
      keyword_cluster: "digital-home",
      intent_type: "comparison" as const,
      priority: "high" as const,
      status: "draft" as const,
      pillar_topic: "Digital Home",
      created_by: "content_agent",
      content_object_id: articleData[1].id,
    });

  // Add a "published" calendar entry linked to the published article
  const { error: pubCalErr } = await supabase
    .from("content_calendar")
    .insert({
      title: "The Future of AI Agents in Digital Marketing",
      target_keyword: "ai agents digital marketing",
      keyword_cluster: "ai-strategy",
      intent_type: "informational" as const,
      priority: "high" as const,
      status: "published" as const,
      pillar_topic: "AI Strategy",
      created_by: "content_agent",
      content_object_id: articleData[0].id,
    });

  if (draftCalErr || pubCalErr) {
    console.error("Linked calendar insert failed:", draftCalErr?.message || pubCalErr?.message);
    return;
  }
  console.log("✓ Linked articles to calendar entries");

  console.log("\n✅ Done! Refresh the dashboard to see the data.");
}

main();
