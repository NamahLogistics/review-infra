import { createRoot } from "react-dom/client";
import React from "react";
import { TopRating } from "./index";

(window as any).renderReviewInfra = function ({
  mountId,
  productId,
  apiKey,
  apiBaseUrl,
}: any) {
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
};
