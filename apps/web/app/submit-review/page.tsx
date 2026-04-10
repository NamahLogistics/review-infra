'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function SubmitReviewPage() {
  const [apiKey, setApiKey] = useState('');
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const qApiKey = url.searchParams.get('apiKey') || '';
    const qProductId = url.searchParams.get('productId') || '';
    const qAuthorName = url.searchParams.get('authorName') || '';
    const qAuthorEmail = url.searchParams.get('authorEmail') || '';

    if (qApiKey) setApiKey(qApiKey);
    if (qProductId) setProductId(qProductId);
    if (qAuthorName) setAuthorName(qAuthorName);
    if (qAuthorEmail) setAuthorEmail(qAuthorEmail);
  }, []);

  async function submitReview() {
    setSubmitting(true);
    setResult(null);

    const res = await fetch(`${API_BASE}/public-reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        productId,
        rating,
        title,
        text,
        authorName,
        authorEmail,
      }),
    });

    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Leave a review</div>
          <div style={{ marginTop: 8, opacity: 0.65 }}>Share your experience in under a minute.</div>

          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID or externalId" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Rating</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: value === rating ? '2px solid #111' : '1px solid #ddd',
                      background: value === rating ? '#111' : '#fff',
                      color: value === rating ? '#fff' : '#111',
                      cursor: 'pointer',
                    }}
                  >
                    {value}★
                  </button>
                ))}
              </div>
            </div>

            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell others what you liked, what could be better, and whether you'd recommend it." style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14, minHeight: 160, resize: 'vertical' }} />
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="Your email" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />

            <button onClick={submitReview} disabled={submitting} style={{ padding: 16, borderRadius: 16, background: '#111', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 20 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
