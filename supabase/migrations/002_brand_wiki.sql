-- Brand Wiki migration
-- Stores the Orloffs Brand Wiki (github.com/jrorloff1-svg/brand-wiki) as the
-- brand's source of truth inside the shared Supabase.
--
-- Three layers (mirrors the repo):
--   brand_wiki_sources    <- sources/    raw material (immutable)
--   brand_wiki_articles   <- wiki/       Claude-generated articles
--   brand_wiki_documents  <- exports/, index.md, log.md, CLAUDE.md (whole-file docs)
--
-- Derived output (site/*.html) is intentionally NOT stored: it is regenerated
-- from the layers above by build-site.py.
--
-- Data is loaded by scripts/sync-brand-wiki.mjs after this migration runs.

-- Reuse the shared timestamp trigger from 001 (create or replace is harmless).
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Raw source material (sources/) - immutable reference layer
-- ---------------------------------------------------------------------------
create table if not exists brand_wiki_sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- filename without extension
  title         text not null,                 -- first heading in the file
  description   text,                           -- one-line summary from index.md
  business      text,                           -- Service | Training | Both
  source_ref    text,                           -- the "Source:" line
  captured_date date,                           -- the "Captured:" line
  file_type     text not null default 'md',     -- md | ts
  content       text not null,                  -- full raw file
  file_path     text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Wiki articles (wiki/) - the intelligence layer
-- ---------------------------------------------------------------------------
create table if not exists brand_wiki_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,           -- filename without .md
  category      text not null,                  -- identity|audience|offers|voice|proof|market|strategy
  title         text not null,                  -- first heading in the file
  status        text not null default 'active', -- active | retired | dissolved
  summary       text,                           -- one-line summary from index.md
  source_refs   text[],                         -- the "Sources:" line, split
  last_updated  date,                           -- the "Last updated:" line
  content       text not null,                  -- full markdown article
  file_path     text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Whole-file documents (exports/, index.md, log.md, CLAUDE.md)
-- ---------------------------------------------------------------------------
create table if not exists brand_wiki_documents (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  doc_type   text not null,                     -- export | index | log | schema
  title      text,
  content    text not null,
  file_path  text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for common lookups
-- ---------------------------------------------------------------------------
create index if not exists brand_wiki_articles_category_idx on brand_wiki_articles (category);
create index if not exists brand_wiki_articles_status_idx   on brand_wiki_articles (status);
create index if not exists brand_wiki_sources_business_idx  on brand_wiki_sources (business);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists brand_wiki_sources_updated_at on brand_wiki_sources;
create trigger brand_wiki_sources_updated_at
  before update on brand_wiki_sources
  for each row execute function update_updated_at();

drop trigger if exists brand_wiki_articles_updated_at on brand_wiki_articles;
create trigger brand_wiki_articles_updated_at
  before update on brand_wiki_articles
  for each row execute function update_updated_at();

drop trigger if exists brand_wiki_documents_updated_at on brand_wiki_documents;
create trigger brand_wiki_documents_updated_at
  before update on brand_wiki_documents
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: locked down (service role bypasses RLS), same posture as 001
-- ---------------------------------------------------------------------------
alter table brand_wiki_sources   enable row level security;
alter table brand_wiki_articles  enable row level security;
alter table brand_wiki_documents enable row level security;
