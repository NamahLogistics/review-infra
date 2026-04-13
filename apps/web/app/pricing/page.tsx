'use client';

export default function Page() {
  return (
    <main style={{ padding: 20, fontFamily: 'Inter', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 20 }}>
        <h1>Pricing</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

          <div style={card}>
            <h2>Free</h2>
            <p>$0</p>
            <ul>
              <li>1 store</li>
              <li>50 orders/month</li>
              <li>Basic widget</li>
            </ul>
          </div>

          <div style={card}>
            <h2>Pro</h2>
            <p>$9/month per store</p>
            <ul>
              <li>Unlimited orders</li>
              <li>Automation</li>
              <li>Moderation</li>
              <li>Analytics</li>
            </ul>
          </div>

          <div style={card}>
            <h2>Growth</h2>
            <p>$29/month per store</p>
            <ul>
              <li>Multi-store</li>
              <li>Priority processing</li>
              <li>Advanced analytics</li>
            </ul>
          </div>

        </div>
      </div>
    </main>
  );
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  border: '1px solid #e5e7eb'
};
