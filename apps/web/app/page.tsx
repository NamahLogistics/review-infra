'use client';

import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

function ctaPrimary(): React.CSSProperties {
  return {
    padding: '16px 22px',
    borderRadius: 16,
    background: '#fff',
    color: '#111',
    textDecoration: 'none',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function ctaSecondary(): React.CSSProperties {
  return {
    padding: '16px 22px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.16)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.04)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(90,90,255,0.18), transparent 32%), #0a0a0f',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
         padding: '48px 16px 32px',
          display: 'grid',
          gap: 32,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            width: 'fit-content',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            fontSize: 13,
            opacity: 0.92,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#7c5cff',
              display: 'inline-block',
            }}
          />
          Reviews for Shopify and headless storefronts
        </div>

        <div
          style={{
            display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 20 }}>
            <h1
              style={{
               fontSize: 'clamp(32px, 9vw, 82px)',
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: -3,
                fontWeight: 800,
                maxWidth: 900,
              }}
            >
              Shopify reviews
              <br />
              with 1-click setup
              <br />
              or 1 script install.
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 20,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.74)',
                maxWidth: 760,
              }}
            >
              Review Infra gives you review collection, moderation, analytics,
              email automation, and storefront display in one system.
              <br />
              <br />
              For Shopify stores, connect and install fast.
              For custom or headless storefronts, paste one script and go live.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/dashboard" style={ctaPrimary()}>
                Start Free → Connect Store
              </Link>

              <a href="https://docs.reviewinfra.dev" target="_blank" style={ctaSecondary()}>
                Docs for Devs →
              </a>

              <Link href="/reviews-demo" style={ctaSecondary()}>
                Live Widget Demo
              </Link>

              <Link href="/orders" style={ctaSecondary()}>
                Test Order Flow
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginTop: 10,
              }}
            >
              {[
                [
                  'Shopify: 1-click',
                  'Connect Shopify, sync products, and install reviews with a guided setup flow.',
                ],
                [
                  'Custom stores: 1 script',
                  'Paste one script on your product page and render reviews on any frontend.',
                ],
                [
                  'Review automation',
                  'Queue review requests after orders, moderate submissions, and track the full flow.',
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  style={{
                    padding: 18,
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.66)',
                    }}
                  >
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                gap: 8,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840' }} />
            </div>

            <pre
              style={{
                margin: 0,
                padding: 22,
                fontSize: 14,
                lineHeight: 1.8,
                color: '#d6d6ff',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
wordBreak: 'break-word',
              }}
            >{`// Shopify
1. Connect store
2. Sync products
3. Install widget
4. Orders -> review emails start automatically

// Custom / headless
<script
  src="${API_BASE}/embed/widget.js?storeId=YOUR_STORE_ID">
</script>

// Orders API
POST ${API_BASE}/orders
{
  "storeId": "YOUR_STORE_ID",
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "productId": "YOUR_PRODUCT_ID",
  "orderRef": "ORDER-1001",
  "externalOrderId": "external-1001"
}`}</pre>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '10px 24px 40px',
          display: 'grid',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Choose your setup path
        </div>

        <div
          style={{
            display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 18,
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800 }}>Shopify stores</div>
            <div
              style={{
                marginTop: 10,
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Connect Shopify, sync products, install the widget, and start collecting reviews with automation.
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {[
                'Connect store from dashboard',
                'Sync products into Review Infra',
                'Install review widget',
                'Send review emails after orders',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.82)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800 }}>Custom / headless stores</div>
            <div
              style={{
                marginTop: 10,
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Use one script for storefront display and send orders to the Orders API to start review automation.
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {[
                'Create custom store workspace',
                'Add products or import them',
                'Paste one script on product page',
                'Send orders to Orders API',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.82)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 24px 80px',
          display: 'grid',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Why developers choose this
        </div>

        <div
          style={{
            display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
          }}
        >
          {[
            [
              'Works beyond Liquid',
              'Use reviews in Hydrogen, Next.js, custom storefronts, mobile apps, or embedded scripts without fighting theme-only plugins.',
            ],
            [
              'One system, full review flow',
              'Orders, emails, submission, moderation, events, analytics, widgets, and demos all live in one product surface.',
            ],
            [
              'Built for activation',
              'From guided setup to live widget preview, the product is designed to get stores working fast instead of dumping everything in one admin screen.',
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              style={{
                padding: 24,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {text}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}