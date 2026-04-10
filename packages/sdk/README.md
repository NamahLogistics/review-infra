# @review-infra/sdk

Typed client for Review Infra.

## Install

pnpm add @review-infra/sdk

## Reviews

import { ReviewInfraClient } from '@review-infra/sdk';

const client = new ReviewInfraClient({
  apiBaseUrl: 'https://your-api-domain.com',
  apiKey: 'YOUR_API_KEY',
});

const reviews = await client.getReviews({
  productId: 'prod_1',
  page: 1,
  limit: 5,
  sort: 'newest',
});

## Submit review

await client.submitReview({
  apiKey: 'YOUR_API_KEY',
  productId: 'prod_1',
  rating: 5,
  title: 'Amazing',
  text: 'Loved it',
  authorName: 'Shubham',
  authorEmail: 'dev@example.com',
});

## Auth + stores

const auth = new ReviewInfraClient({
  apiBaseUrl: 'https://your-api-domain.com',
});

const { token } = await auth.login('dev@example.com', 'password123');

auth.setBearerToken(token);

const store = await auth.createStore('My Store');
const stores = await auth.listStores();

## Nudges

const app = new ReviewInfraClient({
  apiBaseUrl: 'https://your-api-domain.com',
  bearerToken: token,
});

const nudge = await app.createNudge({
  storeId: 'store_id',
  productId: 'product_id',
  customerName: 'Customer',
  customerEmail: 'customer@example.com',
  orderRef: 'order_1',
});

const analytics = await app.getNudgeAnalytics('store_id');
await app.sendNudge(nudge.id);
