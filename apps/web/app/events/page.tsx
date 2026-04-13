'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ReviewEvent = {
  id: string;
  type: string;
  storeId?: string | null;
  productId?: string | null;
  nudgeId?: string | null;
  payload?: any;
  createdAt?: string;
};

type EventsResponse = {
  success?: boolean;
  data?: ReviewEvent[];
  error?: string;
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

function buttonStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function linkButtonStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  };
}

function valueStyle(): React.CSSProperties {
  return {
    fontSize: 14,
    color: '#111827',
    wordBreak: 'break-word',
  };
}

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN');
}

function safePayload(payload: any) {
  if (!payload) return {};
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return { raw: payload };
    }
  }
  return payload;
}

function prettyEventName(type: string) {
  if (type === 'nudge.api_created') return 'Order received → nudge queued';
  if (type === 'nudge.opened') return 'Review email opened';
  if (type === 'nudge.clicked') return 'Review email clicked';
  return type || 'Unknown event';
}

export default function EventsPage() {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('review_infra_store_id') || '';
    setStoreId(s);
    loadEvents();
  }, []);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadEvents() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/tracking/events`);
      const data = (await safeJson(res)) as EventsResponse | null;
      const rows = Array.isArray(data?.data) ? data!.data! : [];
      setEvents(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  const visibleEvents = useMemo(() => {
    const rows = storeId ? events.filter((event) => event.storeId === storeId) : events;
    return rows.map((event) => ({
      ...event,
      parsedPayload: safePayload(event.payload),
    }));
  }, [events, storeId]);

  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' })}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Tracking
            </div>
            <h1 style={{ margin: '8px 0 0', fontSize: 34 }}>Events timeline</h1>
            <div style={{ marginTop: 8, opacity: 0.72 }}>
              Human-readable activity for your current store.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={loadEvents} style={buttonStyle()}>
              Refresh
            </button>
            <Link href="/dashboard" style={linkButtonStyle()}>
              Dashboard
            </Link>
            <Link href="/orders" style={linkButtonStyle()}>
              Orders
            </Link>
            <Link href="/nudges" style={linkButtonStyle()}>
              Nudges
            </Link>
          </div>
        </div>

        {error ? (
          <div style={cardStyle({ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' })}>
            {error}
          </div>
        ) : null}

        <div style={cardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Recent events</h2>
              <div style={{ marginTop: 8, opacity: 0.7 }}>
                {storeId ? 'Showing current store activity' : 'Showing all recent activity'}
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>{visibleEvents.length} events</div>
          </div>

          {loading ? (
            <div style={{ marginTop: 18, opacity: 0.7 }}>Loading events...</div>
          ) : visibleEvents.length ? (
            <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
              {visibleEvents.map((event: any) => {
                const payload = event.parsedPayload || {};
                return (
                  <div
                    key={event.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 18,
                      padding: 18,
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>
                          {prettyEventName(event.type)}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.68 }}>
                          {formatDate(event.createdAt)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        {event.type}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 14,
                        marginTop: 18,
                      }}
                    >
                      <div>
                        <div style={labelStyle()}>Customer Email</div>
                        <div style={valueStyle()}>{payload.customerEmail || '-'}</div>
                      </div>

                      <div>
                        <div style={labelStyle()}>Order Ref</div>
                        <div style={valueStyle()}>{payload.orderRef || '-'}</div>
                      </div>

                      <div>
                        <div style={labelStyle()}>External Order ID</div>
                        <div style={valueStyle()}>{payload.externalOrderId || '-'}</div>
                      </div>

                      <div>
                        <div style={labelStyle()}>Send After</div>
                        <div style={valueStyle()}>{formatDate(payload.sendAfter)}</div>
                      </div>
                    </div>

                    <details style={{ marginTop: 16 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155' }}>
                        Technical details
                      </summary>

                      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                        <div>
                          <div style={labelStyle()}>Store ID</div>
                          <div style={valueStyle()}>{event.storeId || '-'}</div>
                        </div>
                        <div>
                          <div style={labelStyle()}>Product ID</div>
                          <div style={valueStyle()}>{event.productId || '-'}</div>
                        </div>
                        <div>
                          <div style={labelStyle()}>Nudge ID</div>
                          <div style={valueStyle()}>{event.nudgeId || '-'}</div>
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ marginTop: 18, opacity: 0.7 }}>No events found yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}
