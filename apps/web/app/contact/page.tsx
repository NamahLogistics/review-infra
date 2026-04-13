'use client';

export default function Page() {
  return (
    <main style={wrap}>
      <div style={card}>
        <h1>Contact & Support</h1>

        <p>If you need help or have any questions, reach out via email.</p>

        <p><b>Owner:</b> Namah</p>
        <p><b>Email:</b> shubhramishra137@gmail.com</p>

        <p>We typically respond within 24–48 hours.</p>
      </div>
    </main>
  );
}

const wrap = { minHeight:'100vh', padding:20, background:'#f8fafc', fontFamily:'Inter' };
const card = { maxWidth:900, margin:'0 auto', background:'#fff', padding:24, borderRadius:16 };
