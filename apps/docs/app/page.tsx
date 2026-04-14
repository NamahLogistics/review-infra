export default function DocsHomePage() {
  const apiBase = 'https://review-infra-api-production.up.railway.app';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: 16,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
  <div style={{ fontSize: 32, fontWeight: 800 }}>
    Review Infra Docs
  </div>

<a
  href="https://reviewinfra.dev/dashboard"
  style={{
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #111827',
    background: '#111827',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
  }}
>
  Get API Key →
</a>
</div>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
            Review Infra Docs
          </div>
          <div style={{ marginTop: 10, opacity: 0.72, lineHeight: 1.7 }}>
            Reviews for Shopify and headless stores.
            <br />
            Install widget → send orders → collect reviews automatically.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <Section
            title="1. Install widget"
            code={`<script
  src="${apiBase}/embed/widget.js?storeId=YOUR_STORE_ID">
</script>`}
            text="Use this for Shopify or custom/headless storefronts."
          />

          <Section
            title="2. Send orders"
            code={`POST ${apiBase}/orders
{
  "storeId": "YOUR_STORE_ID",
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "productId": "YOUR_PRODUCT_ID",
  "orderRef": "ORDER-1001",
  "externalOrderId": "external-1001"
}`}
            text="This is the main automation trigger. Orders queue review requests."
          />

          <Section
            title="3. Submit reviews manually"
            code={`POST ${apiBase}/public-reviews/submit
{
  "apiKey": "YOUR_API_KEY",
  "productId": "YOUR_PRODUCT_ID",
  "rating": 5,
  "title": "Amazing",
  "text": "Loved it",
  "authorName": "Customer",
  "authorEmail": "customer@example.com"
}`}
            text="Optional fallback for manual review submission."
          />

          <Section
            title="4. Review flow"
            code={`Order created
  ↓
Review nudge queued
  ↓
Email sent
  ↓
Customer submits review
  ↓
Moderation
  ↓
Approved → widget`}
            text="This is the full system flow."
          />

          <Section
            title="5. SDK"
            code={`pnpm add @review-infra/sdk

import { ReviewInfraClient } from '@review-infra/sdk';

const client = new ReviewInfraClient({
  apiBaseUrl: '${apiBase}',
  apiKey: 'YOUR_API_KEY',
});

const data = await client.getReviews({
  productId: 'prod_1',
});`}
            text="Use the SDK when you want programmatic access."
          />

          <Section
            title="6. Core endpoints"
            code={`POST   /orders
POST   /public-reviews/submit
GET    /reviews/:productId
GET    /review-nudges
POST   /review-nudges/send
GET    /tracking/nudge/open/:id
GET    /tracking/nudge/click/:id`}
            text="These are the main endpoints developers need first."
          />
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  code,
  text,
}: {
  title: string;
  code: string;
  text?: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>

      <pre
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 14,
          borderRadius: 14,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginTop: 14,
          fontSize: 13,
          lineHeight: 1.7,
          maxWidth: '100%',
        }}
      >
        {code}
      </pre>

      {text ? (
        <div style={{ marginTop: 12, opacity: 0.72, lineHeight: 1.65 }}>{text}</div>
      ) : null}
    </div>
  );
}