'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ReviewItem = {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
  } | null;
  authorName?: string | null;
  authorEmail?: string | null;
  rating: number;
  title?: string | null;
  text: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  source?: string | null;
  createdAt?: string;
  priority?: 'high' | 'medium' | 'low' | string;
  tags?: string[];
  needsAttention?: boolean;
};

type Filter = 'needs_attention' | 'pending' | 'approved' | 'rejected';

type NudgeAnalytics = {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  opened: number;
  clicked: number;
  totalResends: number;
  completionRate: number;
  openRate: number;
  clickRate: number;
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    ...extra,
  };
}

function buttonStyle(kind: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties {
  if (kind === 'primary') {
    return {
      padding: '10px 14px',
      borderRadius: 12,
      border: '1px solid #111827',
      background: '#111827',
      color: '#fff',
      fontWeight: 700,
      cursor: 'pointer',
    };
  }

  if (kind === 'danger') {
    return {
      padding: '10px 14px',
      borderRadius: 12,
      border: '1px solid #ef4444',
      background: '#fff',
      color: '#b91c1c',
      fontWeight: 700,
      cursor: 'pointer',
    };
  }

  return {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function badgeStyle(status: string): React.CSSProperties {
  if (status === 'approved') {
    return {
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    };
  }

  if (status === 'rejected') {
    return {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    };
  }

  return {
    background: '#fff7ed',
    color: '#9a3412',
    border: '1px solid #fed7aa',
  };
}

function priorityStyle(priority?: string): React.CSSProperties {
  if (priority === 'high') {
    return {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    };
  }

  if (priority === 'medium') {
    return {
      background: '#fff7ed',
      color: '#9a3412',
      border: '1px solid #fed7aa',
    };
  }

  return {
    background: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
  };
}

function toneCard(bg: string, border: string, color: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: 16,
    padding: 14,
  };
}

function sourceLabel(source?: string | null) {
  if (source === 'judgeme_import') return 'Judge.me import';
  if (source === 'public_form') return 'Public review form';
  return source || 'unknown source';
}

export default function ModerationPage() {
  const [storeId, setStoreId] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filter, setFilter] = useState<Filter>('needs_attention');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState('');
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    needsAttention: 0,
  });
  const [nudgeAnalytics, setNudgeAnalytics] = useState<NudgeAnalytics | null>(null);

  const visibleReviews = useMemo(() => {
    if (filter === 'needs_attention') {
      return reviews.filter((review) => review.needsAttention);
    }
    return reviews.filter((review) => review.status === filter);
  }, [reviews, filter]);

  const summary = useMemo(() => {
    return {
      high: reviews.filter((review) => review.priority === 'high' && review.status === 'pending').length,
      medium: reviews.filter((review) => review.priority === 'medium' && review.status === 'pending').length,
      spam: reviews.filter((review) => review.tags?.includes('spam') && review.status === 'pending').length,
      abuse: reviews.filter((review) => review.tags?.includes('abuse') && review.status === 'pending').length,
      safe: reviews.filter((review) => review.status === 'pending' && review.rating >= 4 && !review.tags?.length).length,
      critical: reviews.filter((review) => review.status === 'pending' && review.rating <= 2).length,
    };
  }, [reviews]);

  const insights = useMemo(() => {
    return {
      spamSpike: summary.spam >= 3,
      abuseSpike: summary.abuse >= 2,
      tooManyHighPending: summary.high >= 5,
      safeReviews: summary.safe,
      criticalFeedback: summary.critical,
    };
  }, [summary]);

  async function loadReviews(currentFilter?: Filter) {
    const token = localStorage.getItem('review_infra_user_token') || '';
    const resolvedStoreId = localStorage.getItem('review_infra_store_id') || '';
    const nextFilter = currentFilter || filter;

    setStoreId(resolvedStoreId);

    if (!resolvedStoreId || !token) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      const params = new URLSearchParams();

      if (nextFilter === 'needs_attention') {
        params.set('status', 'pending');
        params.set('attentionOnly', 'true');
      } else {
        params.set('status', nextFilter);
      }

      const [reviewsRes, nudgeRes] = await Promise.all([
        fetch(`${API_BASE}/moderation/store/${resolvedStoreId}/reviews?${params.toString()}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/review-nudges/analytics?storeId=${resolvedStoreId}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const data = await reviewsRes.json().catch(() => null);
      const nudgeData = await nudgeRes.json().catch(() => null);

      if (!reviewsRes.ok) {
        setError(data?.error || 'Failed to load moderation reviews');
        setReviews([]);
        return;
      }

      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      setCounts({
        pending: data?.counts?.pending || 0,
        approved: data?.counts?.approved || 0,
        rejected: data?.counts?.rejected || 0,
        needsAttention: data?.counts?.needsAttention || 0,
      });
      setNudgeAnalytics(nudgeData?.data || null);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load moderation reviews');
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'pending' | 'rejected') {
    const token = localStorage.getItem('review_infra_user_token') || '';
    if (!token) return;

    setActionId(id);
    setStatusText('');

    try {
      const res = await fetch(`${API_BASE}/moderation/reviews/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusText(data?.error || 'Failed to update review');
        return;
      }

      await loadReviews(filter);
      setStatusText(`Review moved to ${status}.`);
    } catch (e: any) {
      setStatusText(e?.message || 'Failed to update review');
    } finally {
      setActionId('');
    }
  }

  async function bulkUpdate(status: 'approved' | 'pending' | 'rejected', ids?: string[]) {
    const token = localStorage.getItem('review_infra_user_token') || '';
    const finalIds = ids || selectedIds;
    if (!token || !finalIds.length) return;

    setBulkBusy(true);
    setStatusText('');

    try {
      const res = await fetch(`${API_BASE}/moderation/reviews/bulk-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: finalIds, status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusText(data?.error || 'Bulk update failed');
        return;
      }

      await loadReviews(filter);
      setStatusText(`${data?.updated || finalIds.length} reviews moved to ${status}.`);
    } catch (e: any) {
      setStatusText(e?.message || 'Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  }

  async function approveSafe() {
    const ids = reviews
      .filter((review) => review.status === 'pending' && review.rating >= 4 && !review.tags?.length)
      .map((review) => review.id);
    await bulkUpdate('approved', ids);
  }

  async function rejectSpam() {
    const ids = reviews
      .filter((review) => review.status === 'pending' && (review.tags?.includes('spam') || review.tags?.includes('abuse')))
      .map((review) => review.id);
    await bulkUpdate('rejected', ids);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    const currentIds = visibleReviews.map((review) => review.id);
    const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
  }

  useEffect(() => {
    loadReviews(filter);
  }, [filter]);

  return (
    <main style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ background: '#111827', color: '#fff', borderColor: '#111827', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' })}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1.2 }}>Review Infra</div>
            <h1 style={{ margin: '8px 0 0' }}>Moderation Queue</h1>
            <div style={{ marginTop: 8, opacity: 0.78 }}>
              Surface risky reviews first, auto-resolve safe ones, and protect the funnel without drowning in manual work.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setRefreshing(true);
                loadReviews(filter);
              }}
              style={buttonStyle('secondary')}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <a
              href="/dashboard"
              style={{
                ...buttonStyle('secondary'),
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Back to dashboard
            </a>
          </div>
        </div>

        {statusText ? (
          <div style={cardStyle({
            borderColor: statusText.toLowerCase().includes('failed') ? '#fca5a5' : '#86efac',
            background: statusText.toLowerCase().includes('failed') ? '#fef2f2' : '#f0fdf4',
            color: statusText.toLowerCase().includes('failed') ? '#991b1b' : '#166534',
          })}>
            {statusText}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={cardStyle()}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Needs Attention</div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{counts.needsAttention}</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>Default decision queue</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>High Priority</div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{summary.high}</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>Low rating / abuse / spam</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Safe Auto-Approve</div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{summary.safe}</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>Positive reviews with no red flags</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Spam / Abuse</div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{summary.spam + summary.abuse}</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>Likely bad actors or unsafe content</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Review Funnel Impact</div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{nudgeAnalytics?.completionRate ?? 0}%</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>Completion rate from nudges</div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h3 style={{ marginTop: 0 }}>System Insights</h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {insights.spamSpike ? <div style={toneCard('#fef2f2', '#fecaca', '#991b1b')}>🚨 Spam spike detected in pending reviews.</div> : null}
            {insights.abuseSpike ? <div style={toneCard('#fef2f2', '#fecaca', '#991b1b')}>⚠️ Abuse content rising. Protect storefront trust first.</div> : null}
            {insights.tooManyHighPending ? <div style={toneCard('#fff7ed', '#fed7aa', '#9a3412')}>🔥 Too many risky reviews are still waiting for a decision.</div> : null}
            {insights.safeReviews > 0 ? <div style={toneCard('#f0fdf4', '#bbf7d0', '#166534')}>✅ {insights.safeReviews} safe reviews can be auto-approved immediately.</div> : null}
            {insights.criticalFeedback > 0 ? <div style={toneCard('#faf5ff', '#d8b4fe', '#7e22ce')}>🛡 {insights.criticalFeedback} low-rating reviews need careful handling before they go live.</div> : null}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={bulkBusy || !summary.safe} onClick={approveSafe} style={buttonStyle('primary')}>
              ⚡ Auto approve safe
            </button>
            <button disabled={bulkBusy || !(summary.spam + summary.abuse)} onClick={rejectSpam} style={buttonStyle('danger')}>
              🚫 Reject spam / abuse
            </button>
          </div>
        </div>

        {nudgeAnalytics ? (
          <div style={cardStyle()}>
            <h3 style={{ marginTop: 0 }}>Connected Nudge Intelligence</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
              {[
                ['Sent', nudgeAnalytics.sent],
                ['Opened', nudgeAnalytics.opened],
                ['Clicked', nudgeAnalytics.clicked],
                ['Completed', nudgeAnalytics.completed],
              ].map(([label, value]) => (
                <div key={label} style={toneCard('#fff', '#e5e7eb', '#111827')}>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>{label}</div>
                  <div style={{ marginTop: 8, fontWeight: 800, fontSize: 22 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 14, opacity: 0.78 }}>
              Open {nudgeAnalytics.openRate}% • Click {nudgeAnalytics.clickRate}% • Complete {nudgeAnalytics.completionRate}% • Resends {nudgeAnalytics.totalResends}
            </div>
          </div>
        ) : null}

        <div style={cardStyle()}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {([
              ['needs_attention', 'Needs Attention'],
              ['pending', 'Pending'],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
            ] as const).map(([value, label]) => {
              const active = filter === value;
              const count =
                value === 'needs_attention'
                  ? counts.needsAttention
                  : value === 'pending'
                    ? counts.pending
                    : value === 'approved'
                      ? counts.approved
                      : counts.rejected;

              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    ...buttonStyle(active ? 'primary' : 'secondary'),
                    borderRadius: 12,
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={toggleSelectAll} style={buttonStyle('secondary')}>
              {visibleReviews.length > 0 && visibleReviews.every((review) => selectedIds.includes(review.id))
                ? 'Clear visible selection'
                : 'Select visible'}
            </button>

            <button disabled={!selectedIds.length || bulkBusy} onClick={() => bulkUpdate('approved')} style={buttonStyle('primary')}>
              {bulkBusy ? 'Updating...' : `Approve selected (${selectedIds.length})`}
            </button>

            <button disabled={!selectedIds.length || bulkBusy} onClick={() => bulkUpdate('rejected')} style={buttonStyle('danger')}>
              {bulkBusy ? 'Updating...' : `Reject selected (${selectedIds.length})`}
            </button>
          </div>

          {error ? (
            <div style={{ marginTop: 14, color: '#991b1b', fontSize: 14 }}>{error}</div>
          ) : null}
        </div>

        {loading ? (
          <div style={cardStyle()}>
            <div style={{ opacity: 0.7 }}>Loading moderation queue...</div>
          </div>
        ) : visibleReviews.length === 0 ? (
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>
              {filter === 'needs_attention' ? 'Nothing needs attention' : `No ${filter} reviews`}
            </h2>
            <div style={{ opacity: 0.72 }}>
              {filter === 'needs_attention'
                ? 'Good reviews are flowing cleanly. Only risky or weak reviews will surface here.'
                : `There are no ${filter} reviews for this store right now.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                style={cardStyle({
                  display: 'grid',
                  gap: 14,
                  border:
                    review.tags?.includes('abuse') ? '2px solid #ef4444' :
                    review.tags?.includes('spam') ? '2px solid #f97316' :
                    review.rating <= 2 ? '2px solid #f59e0b' :
                    '1px solid #e5e7eb',
                })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(review.id)}
                      onChange={() => toggleSelected(review.id)}
                      style={{ marginTop: 4 }}
                    />

                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>
                        {review.title || 'Untitled review'}
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span
                          style={{
                            ...badgeStyle(review.status),
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {review.status}
                        </span>

                        <span
                          style={{
                            ...priorityStyle(review.priority),
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {review.priority || 'low'} priority
                        </span>

                        <span style={{ fontSize: 13, opacity: 0.7 }}>
                          {review.rating}★
                        </span>

                        <span style={{ fontSize: 13, opacity: 0.7 }}>
                          {review.product?.name || review.productId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.6, textAlign: 'right' }}>
                    <div>{sourceLabel(review.source)}</div>
                    <div>{review.createdAt ? new Date(review.createdAt).toLocaleString() : '-'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {review.tags?.includes('abuse') && '🚨 Likely abuse'}
                  {review.tags?.includes('spam') && '⚠️ Likely spam'}
                  {!review.tags?.length && review.rating >= 4 && '✅ Safe review'}
                  {review.rating <= 2 && !review.tags?.includes('abuse') && !review.tags?.includes('spam') && '🔥 Critical feedback'}
                </div>

                {review.tags?.length ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background:
                            tag === 'spam' || tag === 'abuse'
                              ? '#fef2f2'
                              : tag === 'negative'
                                ? '#fff7ed'
                                : '#f8fafc',
                          border:
                            tag === 'spam' || tag === 'abuse'
                              ? '1px solid #fecaca'
                              : tag === 'negative'
                                ? '1px solid #fed7aa'
                                : '1px solid #cbd5e1',
                          color:
                            tag === 'spam' || tag === 'abuse'
                              ? '#991b1b'
                              : tag === 'negative'
                                ? '#9a3412'
                                : '#334155',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1f2937' }}>{review.text}</div>

                <div style={{ display: 'grid', gap: 4, fontSize: 13, opacity: 0.78 }}>
                  <div><b>Author:</b> {review.authorName || 'Anonymous'}</div>
                  <div><b>Email:</b> {review.authorEmail || '-'}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    disabled={actionId === review.id}
                    onClick={() => updateStatus(review.id, 'approved')}
                    style={buttonStyle('primary')}
                  >
                    {actionId === review.id ? 'Updating...' : 'Approve'}
                  </button>

                  <button
                    disabled={actionId === review.id}
                    onClick={() => updateStatus(review.id, 'pending')}
                    style={buttonStyle('secondary')}
                  >
                    {actionId === review.id ? 'Updating...' : 'Mark pending'}
                  </button>

                  <button
                    disabled={actionId === review.id}
                    onClick={() => updateStatus(review.id, 'rejected')}
                    style={buttonStyle('danger')}
                  >
                    {actionId === review.id ? 'Updating...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
