'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 60,
      padding: 20,
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      fontSize: 14
    }}>
      <Link href="/terms">Terms</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/refund-policy">Refund</Link>
      <Link href="/contact">Contact</Link>
      <Link href="/pricing">Pricing</Link>
    </footer>
  );
}
