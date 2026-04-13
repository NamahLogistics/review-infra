'use client';

export default function Page() {
  return (
    <main style={wrap}>
      <div style={card}>
        <h1>Refund Policy</h1>

        <p>We offer refunds within 7 days of purchase if the service does not function as described.</p>

        <h2>Eligibility</h2>
        <p>Refund requests must be made within 7 days of the initial purchase.</p>

        <h2>Non-refundable cases</h2>
        <p>Refunds may not be issued in cases of misuse or violation of terms.</p>

        <h2>Contact</h2>
        <p>Namah<br/>shubhramishra137@gmail.com</p>

        <p style={{opacity:0.6}}>Last updated: April 2026</p>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100vh', padding:20, background:'#f8fafc', fontFamily:'Inter' };
const card = { maxWidth:900, margin:'0 auto', background:'#fff', padding:24, borderRadius:16 };
