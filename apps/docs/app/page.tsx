export default function DocsHomePage() {
  const apiBase = 'https://your-api-domain.com';
  const apiKey = 'YOUR_API_KEY';
  const bearer = 'YOUR_BEARER_TOKEN';

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>Review Infra Docs</div>
          <div style={{ marginTop: 10, opacity: 0.68 }}>Headless reviews, nudges, moderation, and widgets for developers.</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>1. Install SDK</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`pnpm add @review-infra/sdk`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>2. Load reviews</div>
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
          <div style={{ fontSize: 24, fontWeight: 800 }}>3. Submit reviews</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`const result = await client.submitReview({
  apiKey: '${apiKey}',
  productId: 'prod_1',
  rating: 5,
  title: 'Amazing',
  text: 'Loved it',
  authorName: 'Shubham',
  authorEmail: 'dev@example.com',
});`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>4. Auth + stores</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`const auth = new ReviewInfraClient({ apiBaseUrl: '${apiBase}' });

const { token } = await auth.login('dev@example.com', 'password123');

auth.setBearerToken(token);

const store = await auth.createStore('My Store');
const stores = await auth.listStores();`}
          </pre>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>5. Create and send nudges</div>
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
          <div style={{ fontSize: 24, fontWeight: 800 }}>6. Script widget</div>
          <pre style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 16, overflow: 'auto', marginTop: 14 }}>
{`<script src="${apiBase}/embed/widget.js"></script>

<div
  data-review-product="prod_1"
  data-review-api="${apiBase}"
  data-api-key="${apiKey}"
  data-review-sort="newest"
  data-review-limit="5">
</div>`}
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
