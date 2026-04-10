'use client';

import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
          padding: '72px 24px 40px',
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
          Headless review infrastructure for developers
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: 28,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 20 }}>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 84px)',
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: -3,
                fontWeight: 800,
              }}
            >
              Add reviews to your app
              <br />
              in 5 minutes.
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 20,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: 760,
              }}
            >
              Review Infra gives developers a review API, widget, submit flow,
              nudges, moderation, analytics, and SDK — without being locked into
              a bulky merchant plugin.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/dashboard"
                style={{
                  padding: '16px 22px',
                  borderRadius: 16,
                  background: '#fff',
                  color: '#111',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Open Dashboard
              </Link>

              <Link
                href="/reviews-demo"
                style={{
                  padding: '16px 22px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                Live Widget Demo
              </Link>

              <a
                href="https://docs.reviewinfra.dev"
                style={{
                  padding: '16px 22px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                Docs
              </a>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 14,
                marginTop: 10,
              }}
            >
              {[
                ['API-first', 'Built for custom storefronts, Hydrogen, and apps'],
                ['SDK included', 'Typed client for reviews, nudges, auth, and stores'],
                ['Headless by default', 'Use our UI or bring your own frontend'],
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
                lineHeight: 1.75,
                color: '#d6d6ff',
                overflowX: 'auto',
              }}
            >{`import { TopRating } from '@review-infra/widget'

<TopRating
  productId="prod_1"
  apiBaseUrl="${API_BASE}"
  apiKey="YOUR_API_KEY"
/>

// submit
await client.submitReview({
  apiKey: 'YOUR_API_KEY',
  productId: 'prod_1',
  rating: 5,
  text: 'Loved it'
})`}</pre>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '10px 24px 80px',
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
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 18,
          }}
        >
          {[
            [
              'Stop fighting merchant plugins',
              'Use reviews in Hydrogen, headless Shopify, mobile apps, or any custom frontend without bending your product around a plugin UI.',
            ],
            [
              'Collect, moderate, nudge, display',
              'One system for submission, moderation, analytics, nudges, widgets, and SDK usage.',
            ],
            [
              'Built for speed',
              'Developers should be able to go from API key to live reviews in minutes, not days.',
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