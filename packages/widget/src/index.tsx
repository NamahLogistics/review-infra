import React, { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  authorName: string | null;
  verified: boolean;
  source: string;
  createdAt: string;
};

type ReviewsResponse = {
  summary: {
    average: number;
    total: number;
    breakdown: Array<{ rating: number; count: number }>;
  };
  reviews: ReviewItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ color: "#f5a623", fontSize: 18, letterSpacing: 1 }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function TopRating({ productId, apiBaseUrl, apiKey }: any) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [rating, setRating] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "5");
    params.set("sort", sort);
    if (rating) params.set("rating", rating);
    return params.toString();
  }, [page, sort, rating]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(productId)}?${query}`, {
          headers: {
            "x-api-key": apiKey || "",
          },
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load reviews");
        }
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Failed to load reviews");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId, apiBaseUrl, apiKey, query]);

  if (loading && !data) {
    return <div style={{ opacity: 0.7 }}>Loading reviews...</div>;
  }

  if (error && !data) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!data?.summary?.total) {
    return <div style={{ opacity: 0.6 }}>No reviews yet</div>;
  }

  return (
    <div style={{ maxWidth: 520, fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "grid", gap: 12, border: "1px solid #eee", borderRadius: 16, padding: 20, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Customer Reviews</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <Stars rating={data.summary.average} />
              <b>{data.summary.average}</b>
              <span style={{ opacity: 0.6 }}>({data.summary.total} reviews)</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }} style={{ padding: 8, borderRadius: 10 }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>

            <select value={rating} onChange={(e) => { setPage(1); setRating(e.target.value); }} style={{ padding: 8, borderRadius: 10 }}>
              <option value="">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {data.summary.breakdown.map((row) => (
            <div key={row.rating} style={{ display: "grid", gridTemplateColumns: "56px 1fr 36px", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 13 }}>{row.rating}★</div>
              <div style={{ background: "#eee", borderRadius: 999, height: 8, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${data.summary.total ? (row.count / data.summary.total) * 100 : 0}%`,
                    background: "#111",
                    height: "100%",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{row.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {data.reviews.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <Stars rating={r.rating} />
                <div style={{ fontWeight: 700, marginTop: 8 }}>
                  {r.authorName || "Anonymous"} {r.verified ? "• Verified" : ""}
                </div>
                {r.title && (
                  <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>
                    {r.title}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{formatDate(r.createdAt)}</div>
            </div>

            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, opacity: 0.86 }}>
              {r.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!data.pagination.hasPrevPage || loading}
          style={{ padding: "10px 14px", borderRadius: 12 }}
        >
          Previous
        </button>

        <div style={{ fontSize: 13, opacity: 0.7 }}>
          Page {data.pagination.page} of {data.pagination.totalPages}
        </div>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!data.pagination.hasNextPage || loading}
          style={{ padding: "10px 14px", borderRadius: 12 }}
        >
          Next
        </button>
      </div>

      {error ? <div style={{ color: "red", marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
