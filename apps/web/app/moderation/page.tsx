'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function ModerationPage() {
  const [storeId, setStoreId] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const resolvedStoreId = localStorage.getItem('review_infra_store_id') || '';
      const apiKey = localStorage.getItem('review_infra_api_key') || '';

      setStoreId(resolvedStoreId);

      if (!resolvedStoreId || !apiKey) return;

      const res = await fetch(`${API_BASE}/moderation/store/${resolvedStoreId}/reviews`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const apiKey = localStorage.getItem('review_infra_api_key') || '';

    const res = await fetch(`${API_BASE}/moderation/reviews/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ status }),
    });

    const updated = await res.json();

    setReviews((prev) =>
      prev.map((review) => (review.id === id ? updated : review)),
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', display: 'grid', gap: 16 }}>
      <h1>Moderation</h1>
      <div><b>Store ID:</b> {storeId || '-'}</div>

      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            gap: 8,
            maxWidth: 760,
          }}
        >
          <div><b>Product:</b> {review.product?.name || review.productId}</div>
          <div><b>Author:</b> {review.authorName || 'Anonymous'}</div>
          <div><b>Rating:</b> {review.rating}</div>
          <div><b>Title:</b> {review.title || '-'}</div>
          <div><b>Text:</b> {review.text}</div>
          <div><b>Status:</b> {review.status}</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => updateStatus(review.id, 'approved')}>Approve</button>
            <button onClick={() => updateStatus(review.id, 'pending')}>Pending</button>
            <button onClick={() => updateStatus(review.id, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </main>
  );
}
