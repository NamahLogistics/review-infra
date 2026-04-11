export default function DocsHomePage() {
  const apiBase = 'https://review-infra-api-production.up.railway.app';
  const apiKey = 'YOUR_API_KEY';
  const bearer = 'YOUR_BEARER_TOKEN';

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>Review Infra Docs</div>
          <div style={{ marginTop: 10, opacity: 0.68 }}>
            Add reviews to your product page in 1 minute. Use the script widget, then layer on submit flows, SDK usage, nudges, and automation.
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>1. Script widget</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`<script
  src="${apiBase}/embed/widget.js"
  data-api-key="${apiKey}"
  data-product-id="{{ product.id }}">
</script>`}
          </pre>

          <div style={{ marginTop: 12, opacity: 0.75 }}>
            Product id examples: Shopify <code>{`{{ product.id }}`}</code>, React/Hydrogen <code>{`product.id`}</code>, generic <code>{`currentProduct.id`}</code>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>2. Submit reviews</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`await fetch('${apiBase}/public-reviews/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: '${apiKey}',
    productId: '{{ product.id }}',
    rating: 5,
    title: 'Amazing',
    text: 'Loved it',
    authorName: 'Shubham',
    authorEmail: 'dev@example.com',
  }),
});`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>3. Install SDK</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`pnpm add @review-infra/sdk`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>4. Load reviews with SDK</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`import { ReviewInfraClient } from '@review-infra/sdk';

const client = new ReviewInfraClient({
  apiBaseUrl: '${apiBase}',
  apiKey: '${apiKey}',
});

const data = await client.getReviews({
  productId: 'prod_1',
  page: 1,
  limit: 5,
  sort: 'newest',
});`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>5. Auth + stores</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`const auth = new ReviewInfraClient({ apiBaseUrl: '${apiBase}' });

const { token } = await auth.login('dev@example.com', 'password123');

auth.setBearerToken(token);

const store = await auth.createStore('My Store');
const stores = await auth.listStores();`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>6. Create and send nudges</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`const app = new ReviewInfraClient({
  apiBaseUrl: '${apiBase}',
  bearerToken: '${bearer}',
});

const nudge = await app.createNudge({
  storeId: 'store_id',
  productId: 'product_id',
  customerName: 'Customer',
  customerEmail: 'customer@example.com',
  orderRef: 'order_1',
});

const nudges = await app.listNudges('store_id');
await app.sendNudge(nudge.id);`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>7. Core endpoints</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`POST   /auth/register
POST   /auth/login
GET    /auth/me
GET    /stores
POST   /stores
GET    /reviews/:productId
GET    /reviews/admin/list/:productId
POST   /public-reviews/submit
GET    /review-nudges
POST   /review-nudges
POST   /review-nudges/send
POST   /auto-nudges/ingest-order
POST   /cron/run-auto-nudges`}
          </pre>
        </div>
      </div>
    </main>
  );
}
