import React, { useEffect, useState } from "react";

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ color: "#f5a623", fontSize: 18 }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </div>
  );
}

export function TopRating({ productId, apiBaseUrl, apiKey }: any) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState({ average: 0, total: 0 });

  useEffect(() => {
    async function load() {
      const res = await fetch(`${apiBaseUrl}/reviews/${productId}`, {
        headers: {
          "x-api-key": apiKey || "",
        },
      });
      const data = await res.json();
      setReviews(data.reviews || []);
      setSummary(data.summary || { average: 0, total: 0 });
    }

    load();
  }, [productId, apiBaseUrl, apiKey]);

  if (!summary.total) {
    return <div style={{ opacity: 0.6 }}>No reviews yet</div>;
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2 style={{ marginBottom: 10 }}>Customer Reviews</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Stars rating={summary.average} />
        <b>{summary.average}</b>
        <span style={{ opacity: 0.6 }}>({summary.total} reviews)</span>
      </div>

      <div style={{ marginTop: 20 }}>
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Stars rating={r.rating} />
            <div style={{ fontWeight: 600, marginTop: 6 }}>
              {r.authorName || "Anonymous"}
            </div>
            {r.title && (
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500 }}>
                {r.title}
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.8 }}>
              {r.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
