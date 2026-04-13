'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type View = 'attention' | 'pending' | 'sent' | 'completed';

type NudgeItem = {
  id: string;
  status: string;
  resendCount: number;
  customerEmail: string;
  customerName?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
  clickedAt?: string | null;
  completedAt?: string | null;
  sendAfter?: string | null;
  product?: {
    id: string;
    name: string;
  } | null;
};

type Analytics = {
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

type Settings = {
  isEnabled: boolean;
  nudgingLevel: 'low' | 'medium' | 'high';
  sendDelayDays: number;
  followUpDelayDays: number;
  maxReminders: number;
};

type ModerationReview = {
  id: string;
  rating: number;
  priority?: string;
  tags?: string[];
  needsAttention?: boolean;
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

function selectStyle(): React.CSSProperties {
  return {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontSize: 14,
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

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function NudgesPage() {
  const [token, setToken] = useState('');
  const [storeId, setStoreId] = useState('');
  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [attentionReviews, setAttentionReviews] = useState<ModerationReview[]>([]);
  const [view, setView] = useState<View>('attention');
  const [busy, setBusy] = useState(false);
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<'default' | 'success' | 'error'>('default');

  async function loadAll(t: string, s: string) {
    const [nRes, aRes, sRes, mRes] = await Promise.all([
      fetch(`${API_BASE}/review-nudges?storeId=${s}`, {
        headers: { authorization: `Bearer ${t}` },
      }),
      fetch(`${API_BASE}/review-nudges/analytics?storeId=${s}`, {
        headers: { authorization: `Bearer ${t}` },
      }),
      fetch(`${API_BASE}/review-settings/${s}`, {
        headers: { authorization: `Bearer ${t}` },
      }),
      fetch(`${API_BASE}/moderation/store/${s}/reviews?status=pending&attentionOnly=true`, {
        headers: { authorization: `Bearer ${t}` },
      }),
    ]);

    const n = await nRes.json().catch(() => null);
    const a = await aRes.json().catch(() => null);
    const st = await sRes.json().catch(() => null);
    const mr = await mRes.json().catch(() => null);

    setNudges(Array.isArray(n?.data) ? n.data : []);
    setAnalytics(a?.data || null);
    setSettings(st || null);
    setAttentionReviews(Array.isArray(mr?.reviews) ? mr.reviews : []);
  }

  useEffect(() => {
    const t = localStorage.getItem('review_infra_user_token') || '';
    const s = localStorage.getItem('review_infra_store_id') || '';
    setToken(t);
    setStoreId(s);
    if (t && s) {
      loadAll(t, s);
    }
  }, []);

  async function updateSettings(body: Partial<Settings> | { nudgingLevel: string } | { sendDelayDays: number }) {
    if (!token || !storeId) return;
    setBusy(true);
    setStatusText('');
    try {
      const res = await fetch(`${API_BASE}/review-settings/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusTone('error');
        setStatusText(data?.error || 'Failed to update automation');
        return;
      }

      await loadAll(token, storeId);
      setStatusTone('success');
      setStatusText('Automation updated.');
    } finally {
      setBusy(false);
    }
  }

  async function sendNow(id: string) {
    if (!token || !storeId) return;
    setSendingIds((prev) => [...prev, id]);
    setStatusText('');
    try {
      const res = await fetch(`${API_BASE}/review-nudges/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nudgeId: id }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusTone('error');
        setStatusText(data?.error || 'Failed to send nudge');
        return;
      }

      await loadAll(token, storeId);
      setStatusTone('success');
      setStatusText('Nudge sent.');
    } finally {
      setSendingIds((prev) => prev.filter((value) => value !== id));
    }
  }

  const buckets = useMemo(() => ({
    attention: nudges.filter((n) => n.status === 'sent' && !n.completedAt && n.resendCount > 0),
    pending: nudges.filter((n) => n.status === 'pending'),
    sent: nudges.filter((n) => n.status === 'sent'),
    completed: nudges.filter((n) => n.status === 'completed'),
  }), [nudges]);

  const list = buckets[view];

  const insights = useMemo(() => {
    if (!analytics) return null;

    const lowOpen = analytics.openRate < 30;
    const lowClick = analytics.clickRate < 15;
    const lowCompletion = analytics.completionRate < 10;
    const stuckCount = buckets.attention.length;
    const highRiskReviewCount = attentionReviews.filter(
      (review) => review.priority === 'high' || review.tags?.includes('abuse') || review.tags?.includes('spam')
    ).length;

    return {
      lowOpen,
      lowClick,
      lowCompletion,
      stuckCount,
      highRiskReviewCount,
      safePendingCount: buckets.pending.length,
    };
  }, [analytics, buckets, attentionReviews]);

  async function resendStuck() {
    const stuck = buckets.attention.slice(0, 10);
    if (!stuck.length) {
      setStatusTone('default');
      setStatusText('No stuck users right now.');
      return;
    }

    setBusy(true);
    setStatusText('');
    try {
      for (const item of stuck) {
        await sendNow(item.id);
      }
      await loadAll(token, storeId);
      setStatusTone('success');
      setStatusText(`Retried ${stuck.length} stuck nudges.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ background: '#111827', color: '#fff', borderColor: '#111827' })}>
          <h1 style={{ margin: 0 }}>Review Engine</h1>
          <div style={{ marginTop: 8, opacity: 0.78 }}>
            Collect reviews automatically, recover drop-offs, and watch moderation pressure before it hurts trust.
          </div>
        </div>

        {statusText ? (
          <div
            style={cardStyle({
              borderColor:
                statusTone === 'success' ? '#86efac' :
                statusTone === 'error' ? '#fca5a5' :
                '#e5e7eb',
              background:
                statusTone === 'success' ? '#f0fdf4' :
                statusTone === 'error' ? '#fef2f2' :
                '#fff',
              color:
                statusTone === 'success' ? '#166534' :
                statusTone === 'error' ? '#991b1b' :
                '#111827',
            })}
          >
            {statusText}
          </div>
        ) : null}

        {analytics && insights ? (
          <div style={cardStyle()}>
            <h3 style={{ marginTop: 0 }}>What needs attention</h3>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {insights.lowOpen ? <div style={toneCard('#fef2f2', '#fecaca', '#991b1b')}>🚨 Low open rate ({analytics.openRate}%) → subject line or timing is weak.</div> : null}
              {insights.lowClick ? <div style={toneCard('#fff7ed', '#fed7aa', '#9a3412')}>⚠️ People open but do not click ({analytics.clickRate}%) → CTA or offer needs work.</div> : null}
              {insights.lowCompletion ? <div style={toneCard('#fefce8', '#fde68a', '#854d0e')}>❌ People click but do not complete ({analytics.completionRate}%) → review submission flow is adding friction.</div> : null}
              {insights.stuckCount > 0 ? <div style={toneCard('#eff6ff', '#bfdbfe', '#1d4ed8')}>🔥 {insights.stuckCount} nudges look stuck and are good resend candidates.</div> : null}
              {insights.highRiskReviewCount > 0 ? <div style={toneCard('#faf5ff', '#d8b4fe', '#7e22ce')}>🛡 {insights.highRiskReviewCount} risky moderation items detected. Trust layer is under pressure.</div> : null}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button disabled={busy} onClick={resendStuck} style={buttonStyle('primary')}>
                {busy ? 'Working...' : '🔁 Retry stuck nudges'}
              </button>
              <button disabled={busy} onClick={() => updateSettings({ sendDelayDays: 1 })} style={buttonStyle('secondary')}>
                ⚡ Faster nudges
              </button>
            </div>
          </div>
        ) : null}

        {settings ? (
          <div style={cardStyle()}>
            <h3 style={{ marginTop: 0 }}>Automation control</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <button disabled={busy || settings.isEnabled} onClick={() => updateSettings({ isEnabled: true })} style={buttonStyle('primary')}>
                Automation ON
              </button>
              <button disabled={busy || !settings.isEnabled} onClick={() => updateSettings({ isEnabled: false })} style={buttonStyle('danger')}>
                Automation OFF
              </button>
              <select
                value={settings.nudgingLevel}
                onChange={(e) => updateSettings({ nudgingLevel: e.target.value })}
                style={selectStyle()}
              >
                <option value="low">Low nudging</option>
                <option value="medium">Medium nudging</option>
                <option value="high">High nudging</option>
              </select>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Send delay</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>{settings.sendDelayDays} days</div>
              </div>
              <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Follow-up delay</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>{settings.followUpDelayDays} days</div>
              </div>
              <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Max reminders</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>{settings.maxReminders}</div>
              </div>
              <div style={toneCard(settings.isEnabled ? '#f0fdf4' : '#fef2f2', settings.isEnabled ? '#bbf7d0' : '#fecaca', settings.isEnabled ? '#166534' : '#991b1b')}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Current status</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>{settings.isEnabled ? 'Active' : 'Paused'}</div>
              </div>
            </div>
          </div>
        ) : null}

        {analytics ? (
          <div style={cardStyle()}>
            <h3 style={{ marginTop: 0 }}>Conversion funnel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
              {[
                ['Sent', analytics.sent],
                ['Opened', analytics.opened],
                ['Clicked', analytics.clicked],
                ['Completed', analytics.completed],
              ].map(([label, value]) => (
                <div key={label} style={toneCard('#fff', '#e5e7eb', '#111827')}>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>{label}</div>
                  <div style={{ marginTop: 8, fontWeight: 800, fontSize: 22 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 14, opacity: 0.78 }}>
              Open {analytics.openRate}% • Click {analytics.clickRate}% • Complete {analytics.completionRate}% • Total resends {analytics.totalResends}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['attention', `🔥 Attention (${buckets.attention.length})`],
            ['pending', `Pending (${buckets.pending.length})`],
            ['sent', `Sent (${buckets.sent.length})`],
            ['completed', `Done (${buckets.completed.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key as View)}
              style={{
                ...buttonStyle(view === key ? 'primary' : 'secondary'),
                borderRadius: 999,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>
              {view === 'attention' ? 'Nothing is stuck right now' : `No ${view} nudges`}
            </h2>
            <div style={{ opacity: 0.72 }}>
              {view === 'attention'
                ? 'Your review engine is moving cleanly. Nothing currently needs recovery.'
                : `There are no ${view} nudges for this store at the moment.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {list.map((nudge) => (
              <div
                key={nudge.id}
                style={cardStyle({
                  borderColor:
                    view === 'attention' ? '#f59e0b' :
                    nudge.status === 'completed' ? '#86efac' :
                    '#e5e7eb',
                })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{nudge.customerEmail}</div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.72 }}>
                      {nudge.customerName || 'Unknown customer'} · {nudge.product?.name || 'Unknown product'}
                    </div>
                  </div>

                  <div
                    style={{
                      ...toneCard(
                        nudge.status === 'completed' ? '#f0fdf4' : nudge.status === 'pending' ? '#fff7ed' : '#f8fafc',
                        nudge.status === 'completed' ? '#bbf7d0' : nudge.status === 'pending' ? '#fed7aa' : '#cbd5e1',
                        nudge.status === 'completed' ? '#166534' : nudge.status === 'pending' ? '#9a3412' : '#334155'
                      ),
                      minWidth: 140,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Status</div>
                    <div style={{ marginTop: 6, fontWeight: 800 }}>{nudge.status}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Scheduled</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(nudge.sendAfter)}</div>
                  </div>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Sent</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(nudge.sentAt)}</div>
                  </div>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Opened</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(nudge.openedAt)}</div>
                  </div>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Clicked</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(nudge.clickedAt)}</div>
                  </div>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Completed</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(nudge.completedAt)}</div>
                  </div>
                  <div style={toneCard('#f8fafc', '#cbd5e1', '#334155')}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Resends</div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>{nudge.resendCount}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {nudge.status === 'pending' ? (
                    <button
                      disabled={sendingIds.includes(nudge.id)}
                      onClick={() => sendNow(nudge.id)}
                      style={buttonStyle('primary')}
                    >
                      {sendingIds.includes(nudge.id) ? 'Sending...' : 'Send now'}
                    </button>
                  ) : null}

                  {view === 'attention' ? (
                    <span style={toneCard('#fff7ed', '#fed7aa', '#9a3412')}>
                      Recovery candidate
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
