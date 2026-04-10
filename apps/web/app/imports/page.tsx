'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function ImportsPage() {
  const [storeId, setStoreId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedStoreId = localStorage.getItem('review_infra_store_id') || '';
    const savedApiKey = localStorage.getItem('review_infra_api_key') || '';

    setStoreId(savedStoreId);
    setApiKey(savedApiKey);

    if (savedStoreId && savedApiKey) {
      fetch(`${API_BASE}/store/${savedStoreId}/products`, {
        headers: {
          'x-api-key': savedApiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setProducts(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data[0]?.id) {
            setProductId(data[0].id);
          }
        });
    }
  }, []);

  async function seedImport() {
    const res = await fetch(`${API_BASE}/import/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        rows: [
          {
            productName: 'Midnight Oud',
            authorName: 'Aman',
            rating: 4,
            title: 'Good',
            text: 'Strong scent and good projection',
          },
          {
            productName: 'Midnight Oud',
            authorName: 'Priya',
            rating: 5,
            title: 'Loved it',
            text: 'Premium feel and long lasting',
          },
        ],
      }),
    });

    const data = await res.json();
    setResult(data);

    const productsRes = await fetch(`${API_BASE}/store/${storeId}/products`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    const productsData = await productsRes.json();
    setProducts(Array.isArray(productsData) ? productsData : []);
    if (Array.isArray(productsData) && productsData[0]?.id) {
      setProductId(productsData[0].id);
    }
  }

  async function checkReviews() {
    const res = await fetch(`${API_BASE}/reviews/${productId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', display: 'grid', gap: 16, maxWidth: 760 }}>
      <h1>Review Import Lab</h1>

      <input
        placeholder="Store ID"
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
      />

      <button onClick={seedImport} style={{ padding: 12, borderRadius: 8 }}>
        Import Demo Reviews
      </button>

      <hr />

      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
      >
        <option value="">Select Product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} — {product.id}
          </option>
        ))}
      </select>

      <input
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
      />

      <button onClick={checkReviews} style={{ padding: 12, borderRadius: 8 }}>
        Fetch Product Reviews
      </button>

      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, overflow: 'auto' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}
