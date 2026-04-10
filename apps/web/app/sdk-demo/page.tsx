'use client';

import { useState } from 'react';
import { ReviewInfraClient } from '@review-infra/sdk';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const client = new ReviewInfraClient({ apiBaseUrl: API_BASE });

export default function SdkDemoPage() {
  const [apiKey, setApiKey] = useState('e3105958829ecb1de93658d25ed23c84');
  const [productId, setProductId] = useState('prod_1');
  const [output, setOutput] = useState<any>(null);

  async function loadReviews() {
    client.setApiKey(apiKey);
    const data = await client.getReviews({ productId, page: 1, limit: 5, sort: 'newest' });
    setOutput(data);
  }

  async function submitReview() {
    const data = await client.submitReview({
      apiKey,
      productId,
      rating: 5,
      title: 'SDK review',
      text: 'Submitted through the Review Infra SDK demo.',
      authorName: 'SDK User',
      authorEmail: 'sdk@example.com',
    });
    setOutput(data);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>SDK demo</div>
          <div style={{ marginTop: 8, opacity: 0.65 }}>The same API, but through a client package developers can drop in immediately.</div>

          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID / externalId" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={loadReviews} style={{ padding: '12px 16px', borderRadius: 14 }}>Load Reviews</button>
            <button onClick={submitReview} style={{ padding: '12px 16px', borderRadius: 14 }}>Submit Demo Review</button>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <pre style={{ margin: 0, overflow: 'auto' }}>{JSON.stringify(output, null, 2)}</pre>
        </div>
      </div>
    </main>
  );
}
