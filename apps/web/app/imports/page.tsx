'use client';

import { useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type ImportRow = {
  productName: string;
  authorName: string;
  rating: number;
  title?: string;
  text: string;
};

type EnrichedRow = ImportRow & {
  issues: string[];
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  safe: boolean;
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    ...extra,
  };
}

function buttonStyle(kind: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties {
  if (kind === 'primary') {
    return {
      padding: '12px 16px',
      borderRadius: 12,
      border: '1px solid #111827',
      background: '#111827',
      color: '#fff',
      fontWeight: 700,
      cursor: 'pointer',
    };
  }

  if (kind === 'danger') {
    return {
      padding: '12px 16px',
      borderRadius: 12,
      border: '1px solid #ef4444',
      background: '#fff',
      color: '#b91c1c',
      fontWeight: 700,
      cursor: 'pointer',
    };
  }

  return {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 12,
    fontSize: 14,
  };
}

function badgeStyle(kind: 'high' | 'medium' | 'low' | 'danger' | 'safe'): React.CSSProperties {
  if (kind === 'high' || kind === 'danger') {
    return {
      padding: '4px 10px',
      borderRadius: 999,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      fontSize: 12,
      fontWeight: 700,
    };
  }

  if (kind === 'medium') {
    return {
      padding: '4px 10px',
      borderRadius: 999,
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      color: '#9a3412',
      fontSize: 12,
      fontWeight: 700,
    };
  }

  if (kind === 'safe') {
    return {
      padding: '4px 10px',
      borderRadius: 999,
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
      fontSize: 12,
      fontWeight: 700,
    };
  }

  return {
    padding: '4px 10px',
    borderRadius: 999,
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#334155',
    fontSize: 12,
    fontWeight: 700,
  };
}

function normalizeText(value?: string) {
  return String(value || '').trim();
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function enrichRow(row: ImportRow): EnrichedRow {
  const text = normalizeText(row.text);
  const productName = normalizeText(row.productName);
  const authorName = normalizeText(row.authorName);
  const issues: string[] = [];
  const tags: string[] = [];

  if (!productName) issues.push('missing product');
  if (!authorName) issues.push('missing author');
  if (!text) issues.push('missing review text');
  if (text.length > 0 && text.length < 10) issues.push('text too short');
  if (!Number.isFinite(row.rating) || row.rating < 1 || row.rating > 5) issues.push('invalid rating');

  const normalized = text.toLowerCase();

  if (normalized.includes('http://') || normalized.includes('https://') || normalized.includes('www.')) {
    tags.push('spam');
  }

  if (/(.)\1{7,}/.test(normalized)) {
    tags.push('spam');
  }

  if (
    normalized.includes('fuck') ||
    normalized.includes('shit') ||
    normalized.includes('bitch') ||
    normalized.includes('asshole') ||
    normalized.includes('bastard')
  ) {
    tags.push('abuse');
  }

  if (
    normalized.includes('late') ||
    normalized.includes('delivery') ||
    normalized.includes('shipping')
  ) {
    tags.push('delivery');
  }

  if (
    normalized.includes('size') ||
    normalized.includes('fit') ||
    normalized.includes('small') ||
    normalized.includes('large')
  ) {
    tags.push('sizing');
  }

  if (
    normalized.includes('quality') ||
    normalized.includes('broken') ||
    normalized.includes('cheap')
  ) {
    tags.push('quality');
  }

  if (row.rating <= 2) tags.push('negative');

  const uniqueTags = Array.from(new Set(tags));

  const priority: 'high' | 'medium' | 'low' =
    row.rating <= 2 || uniqueTags.includes('spam') || uniqueTags.includes('abuse')
      ? 'high'
      : row.rating === 3
        ? 'medium'
        : 'low';

  const safe = issues.length === 0 && uniqueTags.length === 0 && row.rating >= 4;

  return {
    ...row,
    issues,
    tags: uniqueTags,
    priority,
    safe,
  };
}

export default function ImportsPage() {
  const [storeId, setStoreId] = useState('');
  const [token, setToken] = useState('');
  const [rows, setRows] = useState<EnrichedRow[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');

  function handleFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      const sId = localStorage.getItem('review_infra_store_id') || '';
      const t = localStorage.getItem('review_infra_user_token') || '';

      setStoreId(sId);
      setToken(t);
      setFileName(file.name);

      const fileContent = String(reader.result || '');
      const lines = fileContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setRows([]);
        setStatus('CSV has no importable rows.');
        return;
      }

      const parsed: EnrichedRow[] = lines.slice(1).map((line) => {
        const [pName, aName, rate, rTitle, rText] = parseCsvLine(line);
        return enrichRow({
          productName: pName || '',
          authorName: aName || '',
          rating: Number(rate) || 0,
          title: rTitle || '',
          text: rText || '',
        });
      });

      setRows(parsed);
      setStatus(`${parsed.length} rows analyzed and ready.`);
    };

    reader.readAsText(file);
  }

  async function importData(mode: 'all' | 'safe' | 'priority') {
    if (!rows.length) return;

    const selected =
      mode === 'safe'
        ? rows.filter((row) => row.safe)
        : mode === 'priority'
          ? rows.filter((row) => row.priority === 'high' || row.priority === 'medium')
          : rows.filter((row) => row.issues.length === 0);

    if (!selected.length) {
      setStatus(
        mode === 'safe'
          ? 'No safe rows found.'
          : mode === 'priority'
            ? 'No high/medium priority rows found.'
            : 'No valid rows found.'
      );
      return;
    }

    setBusy(true);
    setStatus('Importing reviews...');

    try {
      const payload = selected.map((row) => ({
        productName: row.productName,
        authorName: row.authorName,
        rating: row.rating,
        title: row.title,
        text: row.text,
      }));

      const res = await fetch(`${API_BASE}/import/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rows: payload }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus(data?.error || 'Import failed');
        return;
      }

      const highPriority = selected.filter((row) => row.priority === 'high').length;
      const mediumPriority = selected.filter((row) => row.priority === 'medium').length;
      const safeRows = selected.filter((row) => row.safe).length;

      setStatus(
        `Imported ${data?.imported ?? selected.length} reviews · Safe ${safeRows} · High ${highPriority} · Medium ${mediumPriority}`
      );
      setRows([]);

      setTimeout(() => {
        window.location.href = '/moderation';
      }, 900);
    } finally {
      setBusy(false);
    }
  }

  const preview = useMemo(() => rows.slice(0, 8), [rows]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      valid: rows.filter((row) => row.issues.length === 0).length,
      safe: rows.filter((row) => row.safe).length,
      high: rows.filter((row) => row.priority === 'high').length,
      medium: rows.filter((row) => row.priority === 'medium').length,
      spam: rows.filter((row) => row.tags.includes('spam')).length,
      abuse: rows.filter((row) => row.tags.includes('abuse')).length,
      invalid: rows.filter((row) => row.issues.length > 0).length,
    };
  }, [rows]);

  return (
    <main style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={cardStyle({ background: '#111827', color: '#fff', borderColor: '#111827' })}>
          <h1 style={{ marginTop: 0 }}>Review Intake Engine</h1>
          <div style={{ opacity: 0.78 }}>
            Clean, classify, and route imported reviews before they affect trust.
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Upload CSV</h2>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            style={inputStyle()}
          />

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
            Format: productName, authorName, rating, title, text
          </div>

          {fileName ? (
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>
              Loaded: {fileName}
            </div>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Rows</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.total}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Valid</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.valid}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Safe</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.safe}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>High Priority</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.high}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Medium Priority</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.medium}</div>
            </div>
            <div style={cardStyle()}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Spam / Abuse</div>
              <div style={{ marginTop: 8, fontWeight: 800, fontSize: 24 }}>{stats.spam + stats.abuse}</div>
            </div>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Import actions</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => importData('all')} disabled={busy} style={buttonStyle('primary')}>
                {busy ? 'Importing...' : 'Import Valid Rows'}
              </button>
              <button onClick={() => importData('safe')} disabled={busy} style={buttonStyle('secondary')}>
                Import Safe Only
              </button>
              <button onClick={() => importData('priority')} disabled={busy} style={buttonStyle('danger')}>
                Import High / Medium Priority
              </button>
            </div>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Preview and classification</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              {preview.map((row, i) => (
                <div
                  key={i}
                  style={{
                    border:
                      row.tags.includes('abuse') ? '2px solid #ef4444' :
                      row.tags.includes('spam') ? '2px solid #f97316' :
                      row.priority === 'high' ? '2px solid #f59e0b' :
                      '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 16,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{row.productName || 'Unknown product'}</div>
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.72 }}>
                        {row.authorName || 'Unknown author'} · {row.rating}★
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={badgeStyle(row.priority)}>{row.priority} priority</span>
                      {row.safe ? <span style={badgeStyle('safe')}>safe</span> : null}
                      {row.issues.length ? <span style={badgeStyle('danger')}>needs review</span> : null}
                    </div>
                  </div>

                  {row.tags.length ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {row.tags.map((tag) => (
                        <span key={tag} style={badgeStyle(tag === 'spam' || tag === 'abuse' ? 'danger' : 'medium')}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {row.issues.length ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {row.issues.map((issue) => (
                        <span key={issue} style={badgeStyle('danger')}>
                          {issue}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.7, color: '#1f2937' }}>
                    {row.text || '-'}
                  </div>
                </div>
              ))}
            </div>

            {rows.length > preview.length ? (
              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.68 }}>
                Showing first {preview.length} rows out of {rows.length}.
              </div>
            ) : null}
          </div>
        ) : null}

        {status ? (
          <div style={cardStyle()}>
            {status}
          </div>
        ) : null}
      </div>
    </main>
  );
}
