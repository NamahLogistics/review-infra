'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function NudgesPage() {
  const [token, setToken] = useState('');
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [nudges, setNudges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  async function loadAll(savedToken: string, savedStoreId: string) {
    const [nudgesRes, analyticsRes] = await Promise.all([
      fetch(`${API_BASE}/review-nudges?storeId=${savedStoreId}`, {
        headers: { authorization: `Bearer ${savedToken}` },
      }),
      fetch(`${API_BASE}/review-nudges/analytics?storeId=${savedStoreId}`, {
        headers: { authorization: `Bearer ${savedToken}` },
      }),
    ]);

    const nudgesData = await nudgesRes.json();
    const analyticsData = await analyticsRes.json();

    setNudges(Array.isArray(nudgesData?.data) ? nudgesData.data : []);
    setAnalytics(analyticsData?.data || null);
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('review_infra_user_token') || '';
    const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
    setToken(savedToken);
    setStoreId(savedStoreId);

    if (savedToken && savedStoreId) {
      loadAll(savedToken, savedStoreId);
    }
  }, []);

  async function createNudge() {
    const res = await fetch(`${API_BASE}/review-nudges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storeId,
        productId,
        customerName,
        customerEmail,
        orderRef,
      }),
    });

    const data = await res.json();
    setResult(data);

    await loadAll(token, storeId);
  }

  async function sendNudge(nudgeId: string) {
    const res = await fetch(`${API_BASE}/review-nudges/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nudgeId }),
    });

    const data = await res.json();
    setResult(data);

    await loadAll(token, storeId);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Review Nudges</div>
          <div style={{ marginTop: 8, opacity: 0.65 }}>Create, send, and track automated review reminders.</div>

          {analytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(100px, 1fr))', gap: 12, marginTop: 20 }}>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Total</b><div>{analytics.total}</div></div>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Pending</b><div>{analytics.pending}</div></div>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Sent</b><div>{analytics.sent}</div></div>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Completed</b><div>{analytics.completed}</div></div>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Resends</b><div>{analytics.totalResends}</div></div>
              <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 14 }}><b>Rate</b><div>{analytics.completionRate}%</div></div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="Store ID" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Customer email" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="Order ref" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />

            <button onClick={createNudge} style={{ padding: 14, borderRadius: 14 }}>
              Create Nudge
            </button>
          </div>
        </div>

        {result && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {nudges.map((nudge) => (
            <div key={nudge.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 20 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><b>Email:</b> {nudge.customerEmail}</div>
                <div><b>Status:</b> {nudge.status}</div>
                <div><b>Product:</b> {nudge.product?.name || nudge.productId}</div>
                <div><b>Send After:</b> {nudge.sendAfter || '-'}</div>
                <div><b>Sent At:</b> {nudge.sentAt || '-'}</div>
                <div><b>Completed At:</b> {nudge.completedAt || '-'}</div>
                <div><b>Resend Count:</b> {nudge.resendCount}</div>
              </div>

              <button onClick={() => sendNudge(nudge.id)} style={{ padding: '12px 16px', borderRadius: 14, marginTop: 14 }}>
                Send Nudge
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
