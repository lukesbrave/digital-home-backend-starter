'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

type CalendarEntry = {
  id: string;
  title: string;
  search_query: string | null;
  target_keyword: string | null;
  keyword_cluster: string | null;
  intent_type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'approved' | 'writing' | 'draft' | 'published' | 'archived';
  pillar_topic: string | null;
  scheduled_publish_date: string | null;
  content_object_id: string | null;
  run_id: string | null;
  created_by: string;
  notes: string | null;
  created_at: string;
};

type StatusCounts = Record<string, number>;

const STATUS_COLORS: Record<string, string> = {
  planned: '#666',
  approved: '#c084fc',
  writing: '#fbbf24',
  draft: '#60a5fa',
  published: '#34d399',
  archived: '#555',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

const STATUSES = ['planned', 'approved', 'writing', 'draft', 'published', 'archived'] as const;

export default function ContentPipelinePage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({});
  const [filter, setFilter] = useState<CalendarEntry['status'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishMode, setPublishMode] = useState<'safe' | 'autonomous'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dh_publish_mode') as 'safe' | 'autonomous') || 'safe';
    }
    return 'safe';
  });

  const supabase = createClient();

  const fetchEntries = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('content_calendar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter) {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    const items = (data || []) as CalendarEntry[];
    setEntries(items);

    // Calculate counts from unfiltered results
    if (!filter) {
      const c: StatusCounts = {};
      for (const e of items) {
        c[e.status] = (c[e.status] || 0) + 1;
      }
      setCounts(c);
    }

    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const togglePublishMode = () => {
    const next = publishMode === 'safe' ? 'autonomous' : 'safe';
    setPublishMode(next);
    localStorage.setItem('dh_publish_mode', next);
  };

  const updateStatus = async (id: string, status: CalendarEntry['status']) => {
    await supabase
      .from('content_calendar')
      .update({ status })
      .eq('id', id);
    fetchEntries();
  };

  const bulkUpdateStatus = async (status: CalendarEntry['status']) => {
    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        supabase.from('content_calendar').update({ status }).eq('id', id)
      )
    );
    setSelected(new Set());
    fetchEntries();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '2rem 2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            Content Pipeline
          </h1>
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            Manage your content calendar, review drafts, and track performance.
          </p>
        </div>
        <button
          onClick={togglePublishMode}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: `1px solid ${publishMode === 'autonomous' ? '#34d399' : '#333'}`,
            background: publishMode === 'autonomous' ? '#34d39915' : '#111',
            color: publishMode === 'autonomous' ? '#34d399' : '#888',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {publishMode === 'autonomous' ? '● Autonomous' : '○ Safe Mode'}
        </button>
      </div>

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <FilterPill
          label={`All (${totalCount})`}
          active={!filter}
          color="#f5f0e8"
          onClick={() => setFilter(null)}
        />
        {STATUSES.map((s) => (
          <FilterPill
            key={s}
            label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s] || 0})`}
            active={filter === s}
            color={STATUS_COLORS[s]}
            onClick={() => setFilter(filter === s ? null : s)}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>
            {selected.size} selected
          </span>
          <ActionBtn label="Approve" color="#c084fc" onClick={() => bulkUpdateStatus('approved')} />
          <ActionBtn label="Archive" color="#555" onClick={() => bulkUpdateStatus('archived')} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p style={{ color: '#444', textAlign: 'center', padding: '4rem' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.15 }}>◇</div>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
            No content in the pipeline yet.
          </p>
          <p style={{ color: '#444', fontSize: '0.8rem' }}>
            Run <code style={{ color: '#c084fc', background: '#c084fc10', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>/content-strategy</code> in Claude Code to generate your first batch of topics.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                <th style={{ ...th, width: '2rem' }}></th>
                <th style={th}>Title</th>
                <th style={{ ...th, width: '9rem' }}>Keyword</th>
                <th style={{ ...th, width: '5rem' }}>Priority</th>
                <th style={{ ...th, width: '6rem' }}>Status</th>
                <th style={{ ...th, width: '7rem' }}>Cluster</th>
                <th style={{ ...th, width: '8rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: '1px solid #111',
                    background: selected.has(entry.id) ? '#ffffff06' : 'transparent',
                  }}
                >
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                      style={{ accentColor: '#c084fc' }}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 500, color: '#f5f0e8' }}>{entry.title}</div>
                    {entry.search_query && (
                      <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                        {entry.search_query}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, color: '#777', fontSize: '0.75rem' }}>
                    {entry.target_keyword || '—'}
                  </td>
                  <td style={td}>
                    <Badge
                      label={entry.priority}
                      color={PRIORITY_COLORS[entry.priority]}
                    />
                  </td>
                  <td style={td}>
                    <Badge
                      label={entry.status}
                      color={STATUS_COLORS[entry.status]}
                    />
                  </td>
                  <td style={{ ...td, color: '#555', fontSize: '0.7rem' }}>
                    {entry.keyword_cluster || '—'}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {entry.status === 'planned' && (
                        <ActionBtn label="Approve" color="#c084fc" onClick={() => updateStatus(entry.id, 'approved')} />
                      )}
                      {entry.status === 'draft' && (
                        <ActionBtn label="Publish" color="#34d399" onClick={() => updateStatus(entry.id, 'published')} />
                      )}
                      {entry.status === 'published' && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_DIGITAL_HOME_URL || ''}/blog/${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.7rem', color: '#60a5fa' }}
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.75rem',
        borderRadius: '4px',
        border: `1px solid ${active ? color : '#222'}`,
        background: active ? `${color}12` : 'transparent',
        color: active ? color : '#666',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        padding: '0.15rem 0.4rem',
        borderRadius: '3px',
        fontSize: '0.65rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '3px',
        border: `1px solid ${color}30`,
        background: 'transparent',
        color,
        cursor: 'pointer',
        fontSize: '0.65rem',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.5rem',
  color: '#555',
  fontWeight: 500,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const td: React.CSSProperties = {
  padding: '0.65rem 0.5rem',
  verticalAlign: 'top',
};
