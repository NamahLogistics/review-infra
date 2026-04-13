'use client';

import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function IntegrationPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Developer Docs
              </div>
              <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(28px, 6vw, 40px)' }}>
                Integration Guide
              </h1>
              <div style={{ marginTop: 8, opacity: 0.72, lineHeight: 1.7 }}>
                This page shows exactly how developers should integrate Review Infra on client sites.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/" style={linkButtonStyle()}>Home</Link>
              <Link href="/dashboard" style={linkButtonStyle()}>Dashboard</Link>
              <a href="https://docs.reviewinfra.dev" style={linkButtonStyle()}>Docs</a>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={cardStyle()}>
            <h2 style={h2Style()}>Path A — Shopify</h2>
            <div style={pStyle()}>
              Use this when the client store is on Shopify and you want Review Infra to handle setup faster.
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {[
                '1. Create or select the store workspace in Review Infra',
                '2. Connect Shopify from the dashboard',
                '3. Sync products',
                '4. Install widget',
                '5. Test review flow from setup / orders page',
              ].map((item) => (
                <div key={item} style={stepStyle()}>
                  {item}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, ...noteStyle() }}>
              For Shopify, developers usually do not need to manually paste the widget script if install is handled from the dashboard.
            </div>
          </div>

          <div style={cardStyle()}>
            <h2 style={h2Style()}>Path B — Custom / Headless</h2>
            <div style={pStyle()}>
              Use this when the client site is custom-built, headless, Hydrogen, Next.js, or any non-theme storefront.
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {[
                '1. Create a custom store workspace in Review Infra',
                '2. Add products or import them',
                '3. Paste the widget script on the product page',
                '4. Send orders to the Orders API after purchase',
                '5. Approve reviews in moderation if needed',
              ].map((item) => (
                <div key={item} style={stepStyle()}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>1. Widget install</h2>
          <div style={pStyle()}>
            Add this script to the client’s product page template.
          </div>

          <pre style={codeStyle()}>
{`<script
  src="${API_BASE}/embed/widget.js?storeId=YOUR_STORE_ID">
</script>`}
          </pre>

          <div style={{ marginTop: 12, ...noteStyle() }}>
            The widget script is store-linked. No manual API key is needed for storefront display.
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>2. Orders API — this starts review automation</h2>
          <div style={pStyle()}>
            The widget only shows reviews. The <b>Orders API</b> is what starts review email automation.
          </div>

          <pre style={codeStyle()}>
{`POST ${API_BASE}/orders
Content-Type: application/json

{
  "storeId": "YOUR_STORE_ID",
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "productId": "YOUR_PRODUCT_ID",
  "orderRef": "ORDER-1001",
  "externalOrderId": "external-1001"
}`}
          </pre>

          <div style={{ marginTop: 12, ...noteStyle() }}>
            Call this from the client’s backend right after a real order is created.
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>3. What is productId?</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={stepStyle()}>
              <b>Shopify:</b> use the synced product from Review Infra, usually mapped from Shopify product ID / legacy resource ID.
            </div>
            <div style={stepStyle()}>
              <b>Custom store:</b> use the product you created in Review Infra. This can be the internal product ID or mapped external ID based on your flow.
            </div>
            <div style={stepStyle()}>
              <b>Rule:</b> the same product identifier used for review display should also be used when sending orders.
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>4. Manual review submission</h2>
          <div style={pStyle()}>
            This is optional. Most integrations should rely on the order → nudge → review flow.
          </div>

          <pre style={codeStyle()}>
{`POST ${API_BASE}/public-reviews/submit
Content-Type: application/json

{
  "apiKey": "YOUR_API_KEY",
  "productId": "YOUR_PRODUCT_ID",
  "rating": 5,
  "title": "Amazing",
  "text": "Loved it",
  "authorName": "Customer",
  "authorEmail": "customer@example.com"
}`}
          </pre>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>5. 5-minute checklist for developers</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              'Store workspace created',
              'Correct store type selected (Shopify or Custom)',
              'Products available in Review Infra',
              'Widget visible on product page',
              'Orders API called after checkout',
              'Review nudge appears in Nudges page',
              'Review can be submitted and seen in Moderation',
            ].map((item) => (
              <div key={item} style={stepStyle()}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={h2Style()}>One-line explanation for developers</h2>
          <div style={{ ...noteStyle(), fontSize: 15 }}>
            <b>Widget script shows reviews.</b> <b>Orders API starts review automation.</b>
          </div>
        </div>
      </div>
    </main>
  );
}

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    minWidth: 0,
    ...extra,
  };
}

function h2Style(): React.CSSProperties {
  return {
    margin: 0,
    fontSize: 22,
  };
}

function pStyle(): React.CSSProperties {
  return {
    marginTop: 10,
    lineHeight: 1.7,
    color: '#475569',
  };
}

function codeStyle(): React.CSSProperties {
  return {
    marginTop: 14,
    background: '#0f172a',
    color: '#e2e8f0',
    padding: 16,
    borderRadius: 16,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: '100%',
    fontSize: 13,
    lineHeight: 1.7,
  };
}

function stepStyle(): React.CSSProperties {
  return {
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    lineHeight: 1.6,
    color: '#111827',
  };
}

function noteStyle(): React.CSSProperties {
  return {
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#334155',
    lineHeight: 1.7,
  };
}

function linkButtonStyle(): React.CSSProperties {
  return {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
