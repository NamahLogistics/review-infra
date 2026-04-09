'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [shop, setShop] = useState('');
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const storeId = url.searchParams.get('storeId');
    const savedStoreId = localStorage.getItem('review_infra_store_id');

    const finalStoreId = storeId || savedStoreId;
    if (!finalStoreId) return;

    fetch(`https://review-infra-api-production.up.railway.app/store/${finalStoreId}`)
      .then((res) => res.json())
      .then((data) => {
        setStore(data);
        localStorage.setItem('review_infra_store_id', data.id);
        localStorage.setItem('review_infra_api_key', data.apiKey);
      });
  }, []);

  async function login() {
    const res = await fetch('https://review-infra-api-production.up.railway.app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setToken(data.token);
  }

  function connectShopify() {
    window.location.href = `https://review-infra-api-production.up.railway.app/shopify/auth/start?shop=${shop}`;
  }

  async function createLocalStore() {
    const res = await fetch('https://review-infra-api-production.up.railway.app/create-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Store' }),
    });

    const data = await res.json();
    setStore(data);
    localStorage.setItem('review_infra_store_id', data.id);
    localStorage.setItem('review_infra_api_key', data.apiKey);
  }

  async function upgrade() {
    const res = await fetch('https://review-infra-api-production.up.railway.app/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id }),
    });

    const data = await res.json();
    window.open(data.checkoutUrl, '_blank');
  }

  async function syncProducts() {
    const res = await fetch('https://review-infra-api-production.up.railway.app/shopify/sync-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id }),
    });

    const data = await res.json();

    if (data.success) {
      const productsRes = await fetch(`https://review-infra-api-production.up.railway.app/store/${store.id}/products`);
      const productsData = await productsRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>

      {!token && !store && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button onClick={login} style={{ padding: 10, borderRadius: 8 }}>
            Login
          </button>
        </div>
      )}

      {token && !store && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 20 }}>
          <input
            placeholder="your-store.myshopify.com"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
          />
          <button onClick={connectShopify} style={{ padding: 10, borderRadius: 8 }}>
            Connect Shopify
          </button>
          <button onClick={createLocalStore} style={{ padding: 10, borderRadius: 8 }}>
            Create Local Store
          </button>
        </div>
      )}

      {store && (
        <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
          <h3>Store Connected</h3>
          <p><b>Name:</b> {store.name}</p>
          <p><b>Shop:</b> {store.shopDomain || '-'}</p>
          <p><b>Store ID:</b> {store.id}</p>
          <p><b>API Key:</b> {store.apiKey}</p>
          <p><b>Plan:</b> {store.plan}</p>

          {store.plan === 'free' && (
            <button onClick={upgrade} style={{ padding: 10, borderRadius: 8, width: 180 }}>
              Upgrade to Pro
            </button>
          )}

          <a href="/imports" style={{ marginTop: 8 }}>Go to Imports</a>

          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, overflow: 'auto' }}>
{`<script src="https://review-infra-api-production.up.railway.app/widget.js"></script>

<div
  data-review-product="YOUR_PRODUCT_ID"
  data-review-api="https://review-infra-api-production.up.railway.app"
  data-api-key="${store.apiKey}">
</div>`}
          </pre>
        </div>
      )}
    </main>
  );
}
