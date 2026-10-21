# Luma – Online Store

A responsive e-commerce storefront built with **React** and **Vite**. Products load from the public [DummyJSON](https://dummyjson.com) API, with a built-in fallback catalogue if the API is unreachable.

**Live demo:** [https://ahmedkhadega979-cloud.github.io/luma.store/](https://ahmedkhadega979-cloud.github.io/luma.store/)

## Features
- Product catalogue from a REST API with loading skeletons and an offline fallback
- Search, category filter, and sorting (price, rating)
- Product details dialog, wishlist (hearts), and a persistent shopping cart
- Cart drawer with quantity controls, discounted prices, and live totals
- Checkout form with validation and accessible error messages, then an order confirmation
- Light and dark mode, data saved in `localStorage`
- Responsive layout, keyboard focus styles, ARIA roles, reduced-motion support

## Tech
React 18 (hooks, `useMemo`, custom `useStored` hook), Fetch API with `AbortController`, Vite, CSS custom properties.

## Source code
The full React source is in the [`source`](./source) folder.

## Run locally
```bash
cd source
npm install
npm run dev
```
