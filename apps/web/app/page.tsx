'use client';

import { TopRating } from '@review-infra/widget';

export default function Page() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Review Infra Demo</h1>
      <TopRating
        productId="shopify_14944222675307"
        apiBaseUrl="https://review-infra-api-production.up.railway.app"
        apiKey="test_1775709900612"
      />
    </main>
  );
}
