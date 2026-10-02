# Stockroom — Inventory Frontend

React + Vite frontend for the Inventory & Order Management API (Django + DRF backend).

## Features

- **Login/Register** — JWT auth against the Django backend, tokens stored and auto-refreshed
- **Dashboard** — stock health stats, low-stock alerts, recent orders
- **Products** — searchable table with a stock-level gauge per product; admins can create/edit/delete
- **Suppliers** — full CRUD (admin only)
- **Orders** — place new orders with multiple line items, expand any order to see items and update its status

Role-aware UI: `staff` users can view everything but only `admin` users see create/edit/delete controls for products and suppliers (matches the backend's `IsAdminOrReadOnly` permission).

## Setup

```bash
npm install
```

By default the app talks to the Django API at `http://127.0.0.1:8000/api` (see `src/api/client.js`, `BASE_URL`). Make sure the backend is running there first — see the `inventory-django` project's README.

## Run

```bash
npm run dev
```

Opens at **http://localhost:5173**. Log in with the seeded admin (`admin` / `admin12345`) or register a new account.

## Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Project structure

```
src/
  api/client.js          # fetch wrapper: JWT attach/refresh, error handling
  context/AuthContext.jsx # global auth state (current user, login/logout)
  components/
    Layout.jsx             # sidebar + page shell
    StockGauge.jsx          # stock-level indicator (product tables)
    ProductFormModal.jsx    # create/edit product
    SupplierFormModal.jsx   # create/edit supplier
    OrderFormModal.jsx      # place a new order (multi-line-item form)
  pages/
    Login.jsx
    Dashboard.jsx
    Products.jsx
    Suppliers.jsx
    Orders.jsx
```

## Notes

- Tokens are stored in `localStorage` for simplicity (fine for a learning
  project/demo; for production you'd typically use httpOnly cookies instead
  to reduce XSS exposure).
- If you change the backend port or deploy it somewhere else, update
  `BASE_URL` in `src/api/client.js`.
- CORS is wide open (`CORS_ALLOW_ALL_ORIGINS = True`) on the Django side for
  development — tighten this before deploying either side.
