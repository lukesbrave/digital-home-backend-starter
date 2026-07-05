'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArticleMeta = {
  slug: string;
  category: string;
  title: string;
  status: 'active' | 'retired' | 'dissolved';
  summary: string | null;
  last_updated: string | null;
  source_refs: string[] | null;
  file_path: string;
};

type SourceMeta = {
  slug: string;
  title: string;
  description: string | null;
  business: string | null;
  file_type: string;
  captured_date: string | null;
  file_path: string;
};

type DocumentMeta = {
  slug: string;
  doc_type: string;
  title: string;
  file_path: string;
};

type Tab = 'articles' | 'sources' | 'documents';
type EntryType = 'article' | 'source' | 'document';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  retired: 'bg-zinc-600',
  dissolved: 'bg-red-500',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BrandWikiPage() {
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  // Detail panel state
  const [selected, setSelected] = useState<{ type: EntryType; slug: string; title: string } | null>(null);
  const [content, setContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    fetch('/api/brand-wiki', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setArticles(d.articles || []);
        setSources(d.sources || []);
        setDocuments(d.documents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openEntry = useCallback((type: EntryType, slug: string, title: string) => {
    setSelected({ type, slug, title });
    setContent('');
    setContentLoading(true);
    fetch(`/api/brand-wiki/${slug}?type=${type}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setContent(d.entry?.content || 'No content.'))
      .catch(() => setContent('Failed to load.'))
      .finally(() => setContentLoading(false));
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(articles.map((a) => a.category))).sort()],
    [articles]
  );

  const q = search.trim().toLowerCase();
  const filteredArticles = articles.filter(
    (a) =>
      (category === 'all' || a.category === category) &&
      (!q || a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q))
  );
  const filteredSources = sources.filter(
    (s) => !q || s.title.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
  );
  const filteredDocuments = documents.filter((d) => !q || d.title.toLowerCase().includes(q));

  const counts = { articles: articles.length, sources: sources.length, documents: documents.length };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-20 px-12 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-medium tracking-widest uppercase text-minimal-muted">
          Brand Wiki
        </h1>
        <div className="flex items-center gap-6">
          {(['articles', 'sources', 'documents'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={`text-xs font-medium tracking-widest uppercase transition-colors ${
                tab === t ? 'text-minimal-accent' : 'text-minimal-muted hover:text-minimal-accent'
              }`}
            >
              {t} <span className="text-minimal-muted">{counts[t]}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Filter bar */}
      <div className="mx-12 mb-6 flex items-center gap-4 shrink-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 max-w-xs bg-minimal-row border border-minimal-border rounded-sm px-4 py-2 text-[13px] text-minimal-accent placeholder:text-minimal-muted focus:outline-none focus:border-minimal-muted"
        />
        {tab === 'articles' && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[10px] font-medium uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-colors whitespace-nowrap ${
                  category === c
                    ? 'border-minimal-muted text-minimal-accent'
                    : 'border-minimal-border text-minimal-muted hover:text-minimal-accent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body: list + detail */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-minimal-muted text-sm">Loading...</div>
      ) : (
        <div className="flex-1 flex gap-6 px-12 pb-6 overflow-hidden">
          {/* List pane */}
          <div className="w-[420px] shrink-0 overflow-y-auto border-t border-minimal-border">
            {tab === 'articles' &&
              filteredArticles.map((a) => (
                <Row
                  key={a.slug}
                  active={selected?.slug === a.slug && selected?.type === 'article'}
                  onClick={() => openEntry('article', a.slug, a.title)}
                  title={a.title}
                  subtitle={a.summary}
                  meta={a.category}
                  dotClass={STATUS_DOT[a.status]}
                  dotTitle={a.status}
                />
              ))}
            {tab === 'sources' &&
              filteredSources.map((s) => (
                <Row
                  key={s.slug}
                  active={selected?.slug === s.slug && selected?.type === 'source'}
                  onClick={() => openEntry('source', s.slug, s.title)}
                  title={s.title}
                  subtitle={s.description}
                  meta={s.business || s.file_type.toUpperCase()}
                />
              ))}
            {tab === 'documents' &&
              filteredDocuments.map((d) => (
                <Row
                  key={d.slug}
                  active={selected?.slug === d.slug && selected?.type === 'document'}
                  onClick={() => openEntry('document', d.slug, d.title)}
                  title={d.title}
                  meta={d.doc_type}
                />
              ))}
          </div>

          {/* Detail pane */}
          <div className="flex-1 overflow-y-auto border border-minimal-border rounded-sm bg-minimal-row">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-4 opacity-10">◇</div>
                <p className="text-minimal-muted text-sm">Select an entry to read it.</p>
              </div>
            ) : (
              <div className="p-10">
                <p className="text-[10px] uppercase tracking-widest text-minimal-muted mb-2">
                  {selected.type}
                </p>
                <h2 className="text-lg font-normal mb-6 text-minimal-accent">{selected.title}</h2>
                {contentLoading ? (
                  <p className="text-minimal-muted text-sm">Loading...</p>
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-neutral-700">
                    {content}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-16 px-12 flex items-center justify-between text-[10px] text-minimal-muted uppercase tracking-[0.2em] shrink-0">
        <span>v0.1</span>
        <span>Digital Home / Brand Wiki</span>
      </footer>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  title,
  subtitle,
  meta,
  dotClass,
  dotTitle,
  active,
  onClick,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string;
  dotClass?: string;
  dotTitle?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-5 border-b border-minimal-border transition-colors ${
        active ? 'bg-minimal-row' : 'hover:bg-minimal-row'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        {dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} title={dotTitle} />}
        <span className="text-[14px] font-light text-minimal-accent leading-snug">{title}</span>
      </div>
      {subtitle && (
        <p className="text-[11px] text-minimal-muted leading-relaxed mb-1.5 line-clamp-2 pl-4">
          {subtitle}
        </p>
      )}
      {meta && (
        <span className="text-[9px] uppercase tracking-widest text-minimal-muted pl-4">{meta}</span>
      )}
    </button>
  );
}
