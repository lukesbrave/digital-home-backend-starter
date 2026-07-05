/**
 * Syncs the Orloffs Brand Wiki repo into Supabase.
 *
 * Reads the brand-wiki repo (wiki/, sources/, exports/, index.md, log.md,
 * CLAUDE.md) and upserts every file into the brand_wiki_* tables created by
 * supabase/migrations/002_brand_wiki.sql.
 *
 * Re-runnable: it upserts on slug, so running it again after the wiki changes
 * just updates the rows. Nothing is deleted.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-brand-wiki.mjs
 *   node --env-file=.env.local scripts/sync-brand-wiki.mjs --dry-run   (parse only, no DB)
 *
 * Override the repo location with BRAND_WIKI_DIR if it moves.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";

const WIKI_DIR =
  process.env.BRAND_WIKI_DIR ||
  "/Users/justinorloff/Desktop/2026 Claude/brand-wiki";

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Small parsing helpers
// ---------------------------------------------------------------------------

/** All files under dir matching one of the extensions (recursive). */
function walk(dir, exts) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue; // skip .DS_Store etc.
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(extname(name))) out.push(full);
  }
  return out;
}

/** First markdown heading in the text, or the filename as a fallback. */
function firstHeading(text, fallback) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

/** Value of a "**Label:** value" bold line, or null. */
function boldField(text, label) {
  const re = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, "im");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

/** Parse index.md into per-path { summary, status } from the article lines. */
function parseIndex(indexText) {
  const map = {};
  for (const line of indexText.split("\n")) {
    // matches:  - [Title](wiki/x/y.md) | summary | date
    //   and:    - ~~[Title](wiki/x/y.md)~~ | RETIRED ...
    const m = line.match(/\]\((wiki\/[^)]+\.md|sources\/[^)]+)\)/);
    if (!m) continue;
    const path = m[1];
    let afterPipe = line.split("|").slice(1).join("|").trim() || null;
    // drop a trailing " | 2026-06-22" date column so summary is just the text
    if (afterPipe) afterPipe = afterPipe.replace(/\s*\|\s*\d{4}-\d{2}-\d{2}\s*$/, "").trim() || null;
    let status = "active";
    if (/~~/.test(line) || /\bRETIRED\b/i.test(line)) status = "retired";
    if (/\bDISSOLVED\b/i.test(line)) status = "dissolved";
    map[path] = { summary: afterPipe, status };
  }
  return map;
}

// ---------------------------------------------------------------------------
// Build rows
// ---------------------------------------------------------------------------

const indexPath = join(WIKI_DIR, "index.md");
const indexText = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
const indexMap = parseIndex(indexText);

// Articles ------------------------------------------------------------------
const articles = walk(join(WIKI_DIR, "wiki"), [".md"]).map((full) => {
  const rel = relative(WIKI_DIR, full); // wiki/identity/founder.md
  const content = readFileSync(full, "utf8");
  const slug = basename(full, ".md");
  const category = rel.split("/")[1]; // identity, audience, ...
  const sourcesLine = boldField(content, "Sources");
  const idx = indexMap[rel] || {};
  const lastUpdated = boldField(content, "Last updated");
  return {
    slug,
    category,
    title: firstHeading(content, slug),
    status: idx.status || "active",
    summary: idx.summary || null,
    source_refs: sourcesLine
      ? sourcesLine.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
    last_updated: normalizeDate(lastUpdated),
    content,
    file_path: rel,
  };
});

// Sources -------------------------------------------------------------------
const sources = walk(join(WIKI_DIR, "sources"), [".md", ".ts"]).map((full) => {
  const rel = relative(WIKI_DIR, full);
  const content = readFileSync(full, "utf8");
  const ext = extname(full).replace(".", "");
  const idx = indexMap[rel] || {};
  return {
    slug: basename(full, extname(full)),
    title: firstHeading(content, basename(full)),
    description: idx.summary || null,
    business: boldField(content, "Business"),
    source_ref: boldField(content, "Source"),
    captured_date: normalizeDate(boldField(content, "Captured")),
    file_type: ext,
    content,
    file_path: rel,
  };
});

// Documents (exports + top-level docs) --------------------------------------
const documents = [];
for (const full of walk(join(WIKI_DIR, "exports"), [".md"])) {
  const content = readFileSync(full, "utf8");
  documents.push({
    slug: basename(full, ".md"),
    doc_type: "export",
    title: firstHeading(content, basename(full)),
    content,
    file_path: relative(WIKI_DIR, full),
  });
}
for (const [name, docType] of [
  ["index.md", "index"],
  ["log.md", "log"],
  ["CLAUDE.md", "schema"],
]) {
  const full = join(WIKI_DIR, name);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  documents.push({
    slug: basename(name, ".md"),
    doc_type: docType,
    title: firstHeading(content, name),
    content,
    file_path: name,
  });
}

/** "2026-06-06" style date passthrough; anything unparseable -> null. */
function normalizeDate(v) {
  if (!v) return null;
  const m = v.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

// ---------------------------------------------------------------------------
// Report + upsert
// ---------------------------------------------------------------------------

console.log(`Brand Wiki source: ${WIKI_DIR}`);
console.log(
  `Parsed: ${articles.length} articles, ${sources.length} sources, ${documents.length} documents`
);

if (DRY_RUN) {
  const byStatus = articles.reduce((a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a), {});
  const byCat = articles.reduce((a, x) => ((a[x.category] = (a[x.category] || 0) + 1), a), {});
  console.log("Article status:", byStatus);
  console.log("Article category:", byCat);
  console.log("\nSample article:", { ...articles[0], content: `[${articles[0].content.length} chars]` });
  console.log("\nSample source:", { ...sources[0], content: `[${sources[0].content.length} chars]` });
  console.log("\n--dry-run: nothing written to the database.");
  process.exit(0);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function upsert(table, rows) {
  const { error, count } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "slug", count: "exact" });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    if (/does not exist|schema cache/i.test(error.message)) {
      console.error(`  -> Apply supabase/migrations/002_brand_wiki.sql first (Supabase SQL editor).`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${table}: upserted ${count ?? rows.length} rows`);
}

await upsert("brand_wiki_sources", sources);
await upsert("brand_wiki_articles", articles);
await upsert("brand_wiki_documents", documents);
console.log("Done.");
