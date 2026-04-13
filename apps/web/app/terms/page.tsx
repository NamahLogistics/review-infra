'use client';

export default function Page() {
  return (
    <main style={wrap}>
      <div style={card}>
        <h1>Terms of Service</h1>

        <p>These Terms govern your use of Review Infra operated by <b>Namah</b>.</p>

        <h2>Service</h2>
        <p>Review Infra provides review collection, widgets, automation, and analytics tools for Shopify and custom storefronts.</p>

        <h2>Accounts</h2>
        <p>You are responsible for maintaining access to your account and connected services.</p>

        <h2>Billing</h2>
        <p>Subscriptions are billed in advance and renew automatically unless canceled.</p>

        <h2>Limitation of Liability</h2>
        <p>We are not liable for data loss, service interruptions, or third-party integrations.</p>

        <h2>Contact</h2>
        <p>Namah<br/>shubhramishra137@gmail.com</p>

        <p style={{opacity:0.6}}>Last updated: April 2026</p>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100vh', padding:20, background:'#f8fafc', fontFamily:'Inter' };
const card = { maxWidth:900, margin:'0 auto', background:'#fff', padding:24, borderRadius:16 };
