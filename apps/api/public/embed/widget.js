(function () {
  try {
    function findScript() {
      if (document.currentScript && document.currentScript.src && document.currentScript.src.indexOf('/embed/widget.js') !== -1) {
        return document.currentScript;
      }
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('/embed/widget.js') !== -1) {
          return scripts[i];
        }
      }
      return null;
    }

    function getApiBase(script) {
      if (!script || !script.src) return 'https://review-infra-api-production.up.railway.app';
      return script.src.split('/embed/')[0];
    }

    function getStoreId(script) {
      if (script && script.getAttribute('data-store-id')) {
        return String(script.getAttribute('data-store-id'));
      }
      if (script && script.src) {
        try {
          var url = new URL(script.src);
          var fromQuery = url.searchParams.get('storeId');
          if (fromQuery) return fromQuery;
        } catch (_) {}
      }
      return null;
    }

    function getProductId(script) {
      if (script && script.getAttribute('data-product-id')) {
        return String(script.getAttribute('data-product-id'));
      }
      if (window.meta && window.meta.product && window.meta.product.id) {
        return String(window.meta.product.id);
      }
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product && window.ShopifyAnalytics.meta.product.id) {
        return String(window.ShopifyAnalytics.meta.product.id);
      }
      var productInput = document.querySelector('form[action*="/cart/add"] input[name="product-id"]');
      if (productInput && productInput.value) return String(productInput.value);
      var variantInput = document.querySelector('form[action*="/cart/add"] input[name="id"]');
      if (variantInput && variantInput.value) return String(variantInput.value);
      return null;
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatDate(value) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (_) {
        return '';
      }
    }

    function createStyles() {
      if (document.getElementById('ri-style')) return;

      var style = document.createElement('style');
      style.id = 'ri-style';
      style.textContent = `
        #reviewinfra-root{width:100%;clear:both}
        .ri-wrap{max-width:1200px;margin:36px auto 0;padding:0 16px;box-sizing:border-box}
        .ri-shell{border-top:1px solid #ece7df;padding-top:28px}
        .ri-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;margin-bottom:20px}
        .ri-title{margin:0;font-size:28px;line-height:1.1;font-weight:700;letter-spacing:-0.02em;color:#111827}
        .ri-sub{margin-top:8px;font-size:14px;line-height:1.6;color:#6b7280}
        .ri-summary{font-size:14px;color:#4b5563;white-space:nowrap}
        .ri-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,0.85fr);gap:28px;align-items:start}
        .ri-listbox{border:1px solid #f0ece4;border-radius:22px;padding:22px;background:#fff}
        .ri-item{padding:16px 0;border-top:1px solid #f3efe8}
        .ri-item:first-child{padding-top:0;border-top:none}
        .ri-stars{color:#d4a447;font-size:14px;letter-spacing:2px}
        .ri-item-title{margin-top:8px;font-size:16px;font-weight:600;line-height:1.4;color:#111827}
        .ri-item-text{margin-top:8px;font-size:14px;line-height:1.7;color:#4b5563}
        .ri-item-meta{margin-top:10px;font-size:12px;color:#8b929c}
        .ri-empty{font-size:14px;line-height:1.7;color:#6b7280}
        .ri-loadmore{margin-top:18px;padding:12px 16px;border-radius:14px;border:1px solid #e5e7eb;background:#fff;color:#111827;font-size:14px;font-weight:600;cursor:pointer}
        .ri-loadmore[disabled]{opacity:.6;cursor:not-allowed}
        .ri-formcard{border:1px solid #f0ece4;border-radius:22px;padding:20px;background:linear-gradient(180deg,#fff 0%,#fffdfa 100%)}
        .ri-formtitle{margin:0 0 6px;font-size:20px;line-height:1.3;font-weight:700;color:#111827}
        .ri-formsub{margin:0 0 16px;font-size:13px;line-height:1.7;color:#6b7280}
        .ri-field{margin-bottom:12px}
        .ri-label{display:block;margin-bottom:7px;font-size:13px;font-weight:600;color:#374151}
        .ri-input,.ri-textarea{width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.4;background:#fff;color:#111827;outline:none}
        .ri-input:focus,.ri-textarea:focus{border-color:#c7cdd4}
        .ri-textarea{min-height:96px;resize:vertical}
        .ri-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ri-starrow{display:flex;gap:8px;align-items:center}
        .ri-starbtn{border:none;background:transparent;padding:0;font-size:22px;line-height:1;color:#d1d5db;cursor:pointer;transition:transform .15s ease,color .15s ease}
        .ri-starbtn:hover{transform:scale(1.06)}
        .ri-starbtn.is-on{color:#d4a447}
        .ri-submit{width:100%;border:none;background:#111827;color:#fff;border-radius:14px;padding:13px 16px;font-size:14px;font-weight:600;cursor:pointer}
        .ri-submit[disabled]{opacity:.65;cursor:not-allowed}
        .ri-msg{margin-bottom:12px}
        .ri-ok{font-size:13px;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px 12px}
        .ri-err{font-size:13px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:10px 12px}
        .ri-note{margin-top:10px;font-size:12px;line-height:1.6;color:#8b929c}
        @media (max-width: 1180px){
          .ri-grid{grid-template-columns:1fr;gap:22px}
        }
        @media (max-width: 768px){
          .ri-wrap{padding:0 12px}
          .ri-title{font-size:24px}
          .ri-row{grid-template-columns:1fr}
          .ri-formcard,.ri-listbox{padding:16px}
        }
      `;
      document.head.appendChild(style);
    }

    function findInsertTarget() {
      var relatedHeading = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,div,p,span')).find(function (el) {
        var text = (el.textContent || '').trim().toLowerCase();
        return text === 'related products';
      });
      if (relatedHeading) return relatedHeading;

      var buyNow = Array.from(document.querySelectorAll('button,a')).find(function (el) {
        var text = (el.textContent || '').trim().toLowerCase();
        return text === 'buy it now';
      });
      if (buyNow) return buyNow;

      var form = document.querySelector('form[action*="/cart/add"]');
      if (form) return form;

      return document.body;
    }

    async function fetchConfig(apiBase, storeId) {
      var res = await fetch(apiBase + '/widget-config/' + encodeURIComponent(storeId));
      if (!res.ok) throw new Error('Failed to load widget config');
      return res.json();
    }

    async function fetchReviews(apiBase, apiKey, productId, page, limit) {
      var res = await fetch(apiBase + '/reviews/' + encodeURIComponent(productId) + '?page=' + page + '&limit=' + limit + '&sort=newest', {
        headers: { 'x-api-key': apiKey }
      });
      if (!res.ok) throw new Error('Failed to load reviews');
      return res.json();
    }

    async function submitReview(apiBase, payload) {
      var res = await fetch(apiBase + '/public-reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var data = null;
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) {
        throw new Error((data && data.error) || 'Could not submit review');
      }

      return data;
    }

    function renderStars(container, state) {
      container.innerHTML = '';
      for (var i = 1; i <= 5; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ri-starbtn' + (i <= state.value ? ' is-on' : '');
        btn.textContent = '★';
        btn.setAttribute('aria-label', i + ' stars');
        (function (value) {
          btn.addEventListener('click', function () {
            state.value = value;
            renderStars(container, state);
          });
        })(i);
        container.appendChild(btn);
      }
    }

    function appendReviews(listNode, reviews, reset) {
      if (reset) listNode.innerHTML = '';
      if (!reviews.length && !listNode.innerHTML.trim()) {
        listNode.innerHTML = '<div class="ri-empty">No reviews yet. Be the first to share your experience.</div>';
        return;
      }
      if (listNode.querySelector('.ri-empty')) {
        listNode.innerHTML = '';
      }
      var html = reviews.map(function (r) {
        return '' +
          '<div class="ri-item">' +
            '<div class="ri-stars">' + '★'.repeat(r.rating || 0) + '</div>' +
            '<div class="ri-item-title">' + escapeHtml(r.title || 'Verified purchase') + '</div>' +
            '<div class="ri-item-text">' + escapeHtml(r.text || '') + '</div>' +
            '<div class="ri-item-meta">' + escapeHtml(r.authorName || 'Anonymous') + (r.createdAt ? ' · ' + escapeHtml(formatDate(r.createdAt)) : '') + '</div>' +
          '</div>';
      }).join('');
      listNode.insertAdjacentHTML('beforeend', html);
    }

    async function init() {
      var script = findScript();
      if (!script) return;

      var apiBase = getApiBase(script);
      var storeId = getStoreId(script);
      var productId = getProductId(script);

      if (!storeId || !productId) return;

      var config = await fetchConfig(apiBase, storeId);
      if (!config || config.disabled) return;
      var apiKey = config && config.apiKey ? config.apiKey : null;

      if (!apiKey) return;

      createStyles();

      var old = document.getElementById('reviewinfra-root');
      if (old) old.remove();

      var root = document.createElement('div');
      root.id = 'reviewinfra-root';
      root.innerHTML =
        '<div class="ri-wrap">' +
          '<div class="ri-shell">' +
            '<div class="ri-head">' +
              '<div>' +
                '<h2 class="ri-title">Customer reviews</h2>' +
                '<div class="ri-sub">Real feedback from people who bought this product</div>' +
              '</div>' +
              '<div class="ri-summary" id="ri-summary">Loading reviews...</div>' +
            '</div>' +
            '<div class="ri-grid">' +
              '<div class="ri-listbox">' +
                '<div id="ri-list"></div>' +
                '<button id="ri-loadmore" class="ri-loadmore" type="button" style="display:none;">Load more reviews</button>' +
              '</div>' +
              '<div class="ri-formcard">' +
                '<h3 class="ri-formtitle">Write a review</h3>' +
                '<p class="ri-formsub">Tell others what stood out for you. Your review will appear after approval.</p>' +
                '<form id="ri-form">' +
                  '<div class="ri-field">' +
                    '<label class="ri-label">Your rating</label>' +
                    '<div id="ri-stars" class="ri-starrow"></div>' +
                  '</div>' +
                  '<div class="ri-row">' +
                    '<div class="ri-field">' +
                      '<label class="ri-label">Your name</label>' +
                      '<input id="ri-name" class="ri-input" type="text" placeholder="Rahul" />' +
                    '</div>' +
                    '<div class="ri-field">' +
                      '<label class="ri-label">Your email</label>' +
                      '<input id="ri-email" class="ri-input" type="email" placeholder="you@example.com" />' +
                    '</div>' +
                  '</div>' +
                  '<div class="ri-field">' +
                    '<label class="ri-label">Title</label>' +
                    '<input id="ri-title" class="ri-input" type="text" placeholder="Loved it" />' +
                  '</div>' +
                  '<div class="ri-field">' +
                    '<label class="ri-label">Your review</label>' +
                    '<textarea id="ri-text" class="ri-textarea" placeholder="Share your honest experience"></textarea>' +
                  '</div>' +
                  '<div id="ri-msg" class="ri-msg"></div>' +
                  '<button id="ri-submit" class="ri-submit" type="submit">Submit review</button>' +
                  '<div class="ri-note">Simple, clean, and designed to feel native on the storefront.</div>' +
                '</form>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var target = findInsertTarget();
      if (target && target.parentNode && target !== document.body) {
        target.parentNode.insertBefore(root, target);
      } else {
        document.body.appendChild(root);
      }

      var listNode = document.getElementById('ri-list');
      var summaryNode = document.getElementById('ri-summary');
      var loadMoreBtn = document.getElementById('ri-loadmore');
      var form = document.getElementById('ri-form');
      var submitBtn = document.getElementById('ri-submit');
      var msgNode = document.getElementById('ri-msg');
      var starsNode = document.getElementById('ri-stars');

      var starState = { value: 5 };
      var page = 1;
      var limit = 5;
      var hasNextPage = false;
      var loadingMore = false;

      renderStars(starsNode, starState);

      async function load(reset) {
        var data = await fetchReviews(apiBase, apiKey, productId, page, limit);
        var summary = data && data.summary ? data.summary : { average: 0, total: 0 };
        summaryNode.textContent = 'Rating ' + (summary.average || 0) + ' · ' + (summary.total || 0) + ' reviews';
        appendReviews(listNode, data.reviews || [], reset);
        hasNextPage = !!(data.pagination && data.pagination.hasNextPage);
        loadMoreBtn.style.display = hasNextPage ? 'inline-flex' : 'none';
      }

      load(true).catch(function () {
        summaryNode.textContent = 'Reviews unavailable right now';
        listNode.innerHTML = '<div class="ri-empty">Could not load reviews right now.</div>';
      });

      loadMoreBtn.addEventListener('click', async function () {
        if (loadingMore || !hasNextPage) return;
        loadingMore = true;
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
        try {
          page += 1;
          await load(false);
        } finally {
          loadingMore = false;
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = hasNextPage ? 'Load more reviews' : 'All reviews loaded';
        }
      });

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        msgNode.innerHTML = '';

        var payload = {
          apiKey: apiKey,
          productId: productId,
          rating: starState.value,
          title: document.getElementById('ri-title').value,
          text: document.getElementById('ri-text').value,
          authorName: document.getElementById('ri-name').value,
          authorEmail: document.getElementById('ri-email').value
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          await submitReview(apiBase, payload);
          msgNode.innerHTML = '<div class="ri-ok">Thanks. Your review was submitted successfully and will appear after approval.</div>';
          form.reset();
          starState.value = 5;
          renderStars(starsNode, starState);
        } catch (err) {
          msgNode.innerHTML = '<div class="ri-err">' + escapeHtml(err && err.message ? err.message : 'Could not submit review') + '</div>';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit review';
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (e) {
    console.error(e);
  }
})();
