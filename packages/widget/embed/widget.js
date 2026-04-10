(function () {
  async function init() {
    const el = document.querySelector('[data-review-product]');
    if (!el) return;

    const productRef = el.getAttribute('data-review-product');
    const apiBaseUrl = el.getAttribute('data-review-api');
    const apiKey = el.getAttribute('data-api-key') || '';
    const initialSort = el.getAttribute('data-review-sort') || 'newest';
    const initialLimit = Number(el.getAttribute('data-review-limit') || '5');

    let page = 1;
    let sort = initialSort;
    let rating = '';

    function stars(value) {
      return `${'★'.repeat(Math.round(value))}${'☆'.repeat(5 - Math.round(value))}`;
    }

    function qs() {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(initialLimit));
      params.set('sort', sort);
      if (rating) params.set('rating', rating);
      return params.toString();
    }

    async function load() {
      try {
        el.innerHTML = '<div style="font-family:sans-serif;opacity:.7">Loading reviews...</div>';
        const res = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(productRef)}?${qs()}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          el.innerHTML = `<div style="font-family:sans-serif;color:red">${data?.error || 'Failed to load reviews'}</div>`;
          return;
        }

        if (!data.summary || !data.summary.total) {
          el.innerHTML = '<div style="font-family:sans-serif;opacity:.7">No reviews yet</div>';
          return;
        }

        const breakdown = (data.summary.breakdown || []).map(
          (row) => `
            <div style="display:grid;grid-template-columns:48px 1fr 28px;gap:8px;align-items:center">
              <div style="font-size:12px">${row.rating}★</div>
              <div style="background:#eee;border-radius:999px;height:8px;overflow:hidden">
                <div style="width:${data.summary.total ? (row.count / data.summary.total) * 100 : 0}%;background:#111;height:100%"></div>
              </div>
              <div style="font-size:12px;opacity:.7">${row.count}</div>
            </div>
          `
        ).join('');

        const reviewsHtml = (data.reviews || []).map(
          (r) => `
            <div style="border:1px solid #eee;border-radius:16px;padding:16px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.04)">
              <div style="display:flex;justify-content:space-between;gap:10px">
                <div>
                  <div style="color:#f5a623;font-size:18px">${stars(r.rating)}</div>
                  <div style="font-weight:700;margin-top:8px">${r.authorName || 'Anonymous'} ${r.verified ? '• Verified' : ''}</div>
                  ${r.title ? `<div style="margin-top:6px;font-size:15px;font-weight:600">${r.title}</div>` : ''}
                </div>
                <div style="font-size:12px;opacity:.6">${new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div style="margin-top:10px;font-size:14px;line-height:1.6;opacity:.86">${r.text}</div>
            </div>
          `
        ).join('');

        el.innerHTML = `
          <div style="font-family:Inter,sans-serif;max-width:520px">
            <div style="display:grid;gap:12px;border:1px solid #eee;border-radius:16px;padding:20px;background:#fff">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
                <div>
                  <div style="font-size:22px;font-weight:700">Customer Reviews</div>
                  <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
                    <div style="color:#f5a623;font-size:18px">${stars(data.summary.average)}</div>
                    <b>${data.summary.average}</b>
                    <span style="opacity:.6">(${data.summary.total} reviews)</span>
                  </div>
                </div>
                <div style="display:grid;gap:8px">
                  <select id="ri-sort" style="padding:8px;border-radius:10px">
                    <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest</option>
                    <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Oldest</option>
                    <option value="highest" ${sort === 'highest' ? 'selected' : ''}>Highest</option>
                    <option value="lowest" ${sort === 'lowest' ? 'selected' : ''}>Lowest</option>
                  </select>
                  <select id="ri-rating" style="padding:8px;border-radius:10px">
                    <option value="" ${rating === '' ? 'selected' : ''}>All ratings</option>
                    <option value="5" ${rating === '5' ? 'selected' : ''}>5 stars</option>
                    <option value="4" ${rating === '4' ? 'selected' : ''}>4 stars</option>
                    <option value="3" ${rating === '3' ? 'selected' : ''}>3 stars</option>
                    <option value="2" ${rating === '2' ? 'selected' : ''}>2 stars</option>
                    <option value="1" ${rating === '1' ? 'selected' : ''}>1 star</option>
                  </select>
                </div>
              </div>
              <div style="display:grid;gap:8px">${breakdown}</div>
            </div>

            <div style="margin-top:16px;display:grid;gap:12px">${reviewsHtml}</div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
              <button id="ri-prev" ${!data.pagination.hasPrevPage ? 'disabled' : ''} style="padding:10px 14px;border-radius:12px">Previous</button>
              <div style="font-size:13px;opacity:.7">Page ${data.pagination.page} of ${data.pagination.totalPages}</div>
              <button id="ri-next" ${!data.pagination.hasNextPage ? 'disabled' : ''} style="padding:10px 14px;border-radius:12px">Next</button>
            </div>
          </div>
        `;

        const sortEl = el.querySelector('#ri-sort');
        const ratingEl = el.querySelector('#ri-rating');
        const prevEl = el.querySelector('#ri-prev');
        const nextEl = el.querySelector('#ri-next');

        if (sortEl) {
          sortEl.addEventListener('change', (e) => {
            page = 1;
            sort = e.target.value;
            load();
          });
        }

        if (ratingEl) {
          ratingEl.addEventListener('change', (e) => {
            page = 1;
            rating = e.target.value;
            load();
          });
        }

        if (prevEl) {
          prevEl.addEventListener('click', () => {
            page = Math.max(1, page - 1);
            load();
          });
        }

        if (nextEl) {
          nextEl.addEventListener('click', () => {
            page = page + 1;
            load();
          });
        }
      } catch (e) {
        el.innerHTML = '<div style="font-family:sans-serif;color:red">Failed to load reviews</div>';
      }
    }

    load();
  }

  init();
})();
