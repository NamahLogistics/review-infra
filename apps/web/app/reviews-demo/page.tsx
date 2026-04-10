'use client';

import { TopRating } from '@review-infra/widget';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function ReviewsDemoPage() {
  const [productId, setProductId] = useState('prod_1');
  const [apiKey, setApiKey] = useState('e3105958829ecb1de93658d25ed23c84');

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Reviews widget demo</div>
          <div style={{ marginTop: 8, opacity: 0.65 }}>This is the plug-and-play frontend your developers will drop in.</div>

          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID / externalId" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" style={{ padding: 14, border: '1px solid #ddd', borderRadius: 14 }} />
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <TopRating productId={productId} apiBaseUrl={API_BASE} apiKey={apiKey} />
        </div>
      </div>
    </main>
  );
}
