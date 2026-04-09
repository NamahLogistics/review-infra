(function () {
  async function init() {
    const el = document.querySelector('[data-review-product]');
    if (!el) return;

    const productRef = el.getAttribute('data-review-product');
    const apiBaseUrl = el.getAttribute('data-review-api');
    const apiKey = el.getAttribute('data-api-key') || '';
    const storeId = el.getAttribute('data-store-id') || '';

    try {
      let finalProductRef = productRef;

      if (storeId && productRef && productRef.startsWith('gid://')) {
        const mapRes = await fetch(
          `${apiBaseUrl}/store/${storeId}/by-external-product/${encodeURIComponent(productRef)}`
        );
        const mapped = await mapRes.json();
        if (mapped && mapped.id) finalProductRef = mapped.externalId || mapped.id;
      }

      const res = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(finalProductRef)}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await res.json();

      if (!data.summary || !data.summary.total) {
        el.innerHTML = '<div style="font-family:sans-serif;opacity:.7">No reviews yet</div>';
        return;
      }

      const reviewsHtml = (data.reviews || [])
        .map(
          (r) => `
            <div style="border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)">
              <div style="color:#f5a623;font-size:18px">${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))}</div>
              <div style="font-weight:600;margin-top:6px">${r.authorName || 'Anonymous'}</div>
              ${r.title ? `<div style="margin-top:4px;font-size:14px;font-weight:500">${r.title}</div>` : ''}
              <div style="margin-top:6px;font-size:14px;opacity:.8">${r.text}</div>
            </div>
          `
        )
        .join('');

      el.innerHTML = `
        <div style="font-family:sans-serif;max-width:420px">
          <h2 style="margin-bottom:10px">Customer Reviews</h2>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="color:#f5a623;font-size:18px">${'★'.repeat(Math.round(data.summary.average))}${'☆'.repeat(5 - Math.round(data.summary.average))}</div>
            <b>${data.summary.average}</b>
            <span style="opacity:.6">(${data.summary.total} reviews)</span>
          </div>
          <div style="margin-top:20px">${reviewsHtml}</div>
        </div>
      `;
    } catch (e) {
      el.innerHTML = '<div style="font-family:sans-serif;color:red">Failed to load reviews</div>';
    }
  }

  init();
})();
