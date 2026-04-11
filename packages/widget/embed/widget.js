(function () {
  try {
    const currentScript = document.currentScript;

    const apiKey = currentScript.getAttribute('data-api-key');
    const productId = currentScript.getAttribute('data-product-id');

    const apiBaseUrl = currentScript.src.split('/embed/')[0];

    const mount = document.createElement('div');
    mount.id = 'reviewinfra-root';
    currentScript.parentNode.insertBefore(mount, currentScript);

    const appScript = document.createElement('script');
    appScript.src = apiBaseUrl + '/embed/widget-bundle.js';
    appScript.async = true;

    appScript.onload = function () {
      if (!window.ReviewInfra || !window.ReviewInfra.renderReviewInfra) {
        console.error('[ReviewInfra] render function missing');
        return;
      }

      window.ReviewInfra.renderReviewInfra({
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
