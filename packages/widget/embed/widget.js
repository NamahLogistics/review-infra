(function () {
  try {
    const script = document.currentScript;

    const apiKey = script?.getAttribute('data-api-key');
    let productId = script?.getAttribute('data-product-id');
    const apiBaseUrl =
      script?.getAttribute('data-review-api') ||
      'https://review-infra-api-production.up.railway.app';

    // Shopify auto-detect
    if (!productId && window.ShopifyAnalytics?.meta?.product?.id) {
      productId = String(window.ShopifyAnalytics.meta.product.id);
    }

    if (!apiKey || !productId) {
      console.warn('[ReviewInfra] Missing apiKey or productId');
      return;
    }

    const mount = document.createElement('div');
    mount.id = 'reviewinfra-root';
    mount.style.marginTop = '40px';

    const target =
      document.querySelector('main') ||
      document.querySelector('#MainContent') ||
      document.body;

    target.appendChild(mount);

    const appScript = document.createElement('script');
    appScript.src = apiBaseUrl + '/embed/widget-bundle.js';
    appScript.async = true;

    appScript.onload = function () {
      if (!window.renderReviewInfra) {
        console.error('[ReviewInfra] render function missing');
        return;
      }

      window.renderReviewInfra({
        mountId: 'reviewinfra-root',
        productId,
        apiKey,
        apiBaseUrl,
      });
    };

    document.body.appendChild(appScript);
  } catch (err) {
    console.error('[ReviewInfra] Failed', err);
  }
})();
