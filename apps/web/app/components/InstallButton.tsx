'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Props = {
  storeId: string;
};

type WidgetStatus = {
  success?: boolean;
  installed?: boolean;
  count?: number;
  scriptTags?: Array<{
    id: number;
    src: string;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  error?: string;
};

export default function InstallButton({ storeId }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<WidgetStatus | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch(`${API_BASE}/shopify/widget-status/${storeId}`);
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ error: 'Failed to load widget status' });
    }
  }

  useEffect(() => {
    if (!storeId) return;
    loadStatus();
  }, [storeId]);

  async function run(path: 'install-widget' | 'reinstall-widget' | 'remove-widget', successText: string) {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/shopify/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        alert(data?.error || 'Failed');
        return;
      }

      alert(successText);
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  const installed = !!status?.installed;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          fontSize: 14,
          color: installed ? '#166534' : '#334155',
          background: installed ? '#f0fdf4' : '#f8fafc',
          border: installed ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
          padding: 12,
          borderRadius: 12,
        }}
      >
        {status?.error
          ? status.error
          : installed
            ? 'Widget is installed on this Shopify store.'
            : 'Widget is not installed yet.'}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!installed ? (
          <button
            disabled={loading}
            onClick={() => run('install-widget', 'Widget installed successfully')}
            style={{ padding: 12, background: '#111', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Working...' : 'Install widget'}
          </button>
        ) : (
          <>
            <button
              disabled={loading}
              onClick={() => run('reinstall-widget', 'Widget reinstalled successfully')}
              style={{ padding: 12, background: '#111', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Working...' : 'Reinstall widget'}
            </button>

            <button
              disabled={loading}
              onClick={() => run('remove-widget', 'Widget removed successfully')}
              style={{ padding: 12, background: '#fff', color: '#b91c1c', borderRadius: 10, border: '1px solid #ef4444', cursor: 'pointer' }}
            >
              {loading ? 'Working...' : 'Remove widget'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
