'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function AnalyticsPage() {
  const [storeId, setStoreId] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const resolvedStoreId = localStorage.getItem('review_infra_store_id') || '';
      const apiKey = localStorage.getItem('review_infra_api_key') || '';

      setStoreId(resolvedStoreId);

      if (!resolvedStoreId || !apiKey) return;

      const res = await fetch(`${API_BASE}/analytics/store/${resolvedStoreId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const json = await res.json();
      setData(json);
    }

    load();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', display: 'grid', gap: 16 }}>
      <h1>Analytics</h1>
      <div><b>Store ID:</b> {storeId || '-'}</div>

      {!data && <div>Loading...</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 12, maxWidth: 900 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><b>Total</b><div>{data.totalReviews}</div></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><b>Average</b><div>{data.averageRating}</div></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><b>Approved</b><div>{data.approved}</div></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><b>Pending</b><div>{data.pending}</div></div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><b>Rejected</b><div>{data.rejected}</div></div>
          </div>

          <div style={{ maxWidth: 600, border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
            <h3>Rating Breakdown</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.byRating.map((row: any) => (
                <div key={row.rating} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: 12, alignItems: 'center' }}>
                  <div>{row.rating} star</div>
                  <div style={{ background: '#eee', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${data.totalReviews ? (row.count / data.totalReviews) * 100 : 0}%`,
                        background: '#111',
                        height: '100%',
                      }}
                    />
                  </div>
                  <div>{row.count}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
