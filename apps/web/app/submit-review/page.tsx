'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type RequestData = {
  nudgeId: string;
  storeName: string;
  apiKey: string;
  productId: string;
  productName: string;
  authorName: string;
  authorEmail: string;
};

type SubmitResult =
  | { ok: true }
  | { ok: false; message: string }
  | null;

function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    ...extra,
  };
}

function inputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%',
    padding: 14,
    border: '1px solid #ddd',
    borderRadius: 14,
    fontSize: 14,
    outline: 'none',
    ...extra,
  };
}

export default function SubmitReviewPage() {
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult>(null);

  const query = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        nudgeId: '',
        apiKey: '',
        productId: '',
        authorName: '',
        authorEmail: '',
      };
    }

    const params = new URL(window.location.href).searchParams;

    return {
      nudgeId: params.get('nudgeId') || '',
      apiKey: params.get('apiKey') || '',
      productId: params.get('productId') || '',
      authorName: params.get('authorName') || '',
      authorEmail: params.get('authorEmail') || '',
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        if (query.nudgeId) {
          const res = await fetch(`${API_BASE}/review-request/${encodeURIComponent(query.nudgeId)}`);
          const data = await res.json().catch(() => null);

          if (!res.ok || !data?.success || !data?.request) {
            setLoadingError(data?.error || 'This review request could not be loaded.');
            return;
          }

          setRequest(data.request);
          setAuthorName(data.request.authorName || '');
          setAuthorEmail(data.request.authorEmail || '');
          return;
        }

        if (query.apiKey && query.productId) {
          const manualRequest: RequestData = {
            nudgeId: '',
            storeName: 'Direct test flow',
            apiKey: query.apiKey,
            productId: query.productId,
            productName: query.productId,
            authorName: query.authorName || '',
            authorEmail: query.authorEmail || '',
          };

          setRequest(manualRequest);
          setAuthorName(query.authorName || '');
          setAuthorEmail(query.authorEmail || '');
          return;
        }

        setLoadingError('This review link is incomplete. Please open the review request email again.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [query]);

  async function submitReview() {
    if (!request) return;

    if (!text.trim()) {
      setResult({ ok: false, message: 'Please write a short review before submitting.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/public-reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: request.apiKey,
          productId: request.productId,
          rating,
          title: title.trim(),
          text: text.trim(),
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setResult({ ok: false, message: data?.error || 'Could not submit your review right now.' });
        return;
      }

      setResult({ ok: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={card()}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Loading your review request…</div>
          </div>
        </div>
      </main>
    );
  }

  if (loadingError || !request) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={card()}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Review link unavailable</div>
            <div style={{ marginTop: 12, opacity: 0.75, lineHeight: 1.7 }}>
              {loadingError || 'This review request is not available.'}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (result?.ok) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={card()}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Thank you for your review</div>
            <div style={{ marginTop: 12, opacity: 0.75, lineHeight: 1.7 }}>
              Your review for <b>{request.productName}</b> has been received and is now waiting for approval before it appears publicly.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={card()}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Leave a review</div>
          <div style={{ marginTop: 8, opacity: 0.65, lineHeight: 1.7 }}>
            You are reviewing <b>{request.productName}</b> from <b>{request.storeName}</b>. It should only take a minute.
          </div>

          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Rating</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
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

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title"
              style={inputStyle()}
            />

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell others what stood out for you."
              style={inputStyle({ minHeight: 160, resize: 'vertical' })}
            />

            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              style={inputStyle()}
            />

            <input
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              placeholder="Your email"
              style={inputStyle()}
            />

            {result && !result.ok ? (
              <div
                style={{
                  fontSize: 14,
                  color: '#991b1b',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                {result.message}
              </div>
            ) : null}

            <button
              type="button"
              onClick={submitReview}
              disabled={submitting}
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
