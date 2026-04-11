import React from "react";
import { createRoot } from "react-dom/client";
import { TopRating } from "./index";

function renderReviewInfra({ mountId, productId, apiKey, apiBaseUrl }: any) {
  const el = document.getElementById(mountId);
  if (!el) return;

  const root = createRoot(el);
  root.render(
    <TopRating
      productId={productId}
      apiKey={apiKey}
      apiBaseUrl={apiBaseUrl}
    />
  );
}

(window as any).ReviewInfra = (window as any).ReviewInfra || {};
(window as any).ReviewInfra.renderReviewInfra = renderReviewInfra;
