'use client';

export default function Page() {
  return (
    <main style={wrap}>
      <div style={card}>
        <h1>Privacy Policy</h1>

        <p>Review Infra collects and processes data to provide its services.</p>

        <h2>Data collected</h2>
        <p>We may collect store data, customer emails, reviews, and order-related data.</p>

        <h2>Usage</h2>
        <p>Data is used for review collection, automation, analytics, and product functionality.</p>

        <h2>Third parties</h2>
        <p>We integrate with services like Shopify and Paddle for billing and platform functionality.</p>

        <h2>Data protection</h2>
        <p>We take reasonable measures to protect your data but cannot guarantee absolute security.</p>

        <h2>Contact</h2>
        <p>Namah<br/>shubhramishra137@gmail.com</p>

        <p style={{opacity:0.6}}>Last updated: April 2026</p>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100vh', padding:20, background:'#f8fafc', fontFamily:'Inter' };
const card = { maxWidth:900, margin:'0 auto', background:'#fff', padding:24, borderRadius:16 };
