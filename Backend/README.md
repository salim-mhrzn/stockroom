# Inventory & Order Management API (Django + DRF)

A REST API for managing products, suppliers, stock, and orders — built with
Django, Django REST Framework, and JWT authentication.

## Features (Week 1–5 scope)

- **Auth**: register/login (JWT via `djangorestframework-simplejwt`), custom `User` model with `role` (admin/staff)
- **Products & Suppliers**: full CRUD via DRF ViewSets, SKU uniqueness, low-stock flag + dedicated `/low_stock/` endpoint, filtering by category
- **Orders**: creating an order validates stock, decrements it atomically (`@transaction.atomic`), and logs every change in `StockMovement`
- **Permissions**: anyone authenticated can read; only `role="admin"` users can create/edit/delete products & suppliers
- **Admin panel** at `/admin/` — fully configured (list filters, search, inline order items) — a working UI with zero frontend code
- **Auto docs**: Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/` (via `drf-spectacular`)
- **Tests**: 15 passing tests covering CRUD, permissions, the stock-decrement business logic, and order cancellation stock restoration
- **Demo data command**: `seed_demo_data` creates a superuser + sample products

## Project Structure

```
config/          # project settings, root urls.py
accounts/        # custom User model, register/login/me, shared permissions
inventory/       # Product, Supplier, StockMovement models + API
orders/          # Order, OrderItem models + API (stock decrement logic lives here)
manage.py
requirements.txt
```

## Setup

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_demo_data   # optional: creates admin user + sample products
```

## Run

```bash
python manage.py runserver
```

Then open:
- http://127.0.0.1:8000/api/docs/ — interactive Swagger UI (try every endpoint here)
- http://127.0.0.1:8000/api/redoc/ — alternate docs view
- http://127.0.0.1:8000/admin/ — Django admin (login: `admin` / `admin12345` if you ran `seed_demo_data`)

## Test

```bash
python manage.py test
```

## Quick walkthrough

1. `POST /api/auth/register/` — create a user (`"role": "admin"` to manage products/suppliers)
2. `POST /api/auth/login/` — body `{"username": "...", "password": "..."}` → returns `{"access": "...", "refresh": "..."}`
3. In Swagger UI, click "Authorize" and enter `Bearer <access_token>`
4. `POST /api/products/` — create a product
5. `POST /api/orders/` — place an order; watch the product's `stock_quantity` drop
6. `GET /api/products/low_stock/` — see products at or below their threshold

Or just log into `/admin/` and manage everything visually — no API calls needed.

## Roadmap (10-week plan)

- [x] Week 1: Project setup, models, migrations, admin registration
- [x] Week 2: Product & Supplier CRUD + tests
- [x] Week 3: Auth (custom User, register/login, JWT, roles)
- [x] Week 4: Orders + stock decrement business logic
- [x] Week 5: Low-stock endpoint, filtering, admin polish, seed command
- [x] Week 6–7: React frontend (product list, order flow, dashboard)
- [x] Week 8: Error handling polish (custom exception handler, protected-delete handling, duplicate-line-item bug fix, cancel-restores-stock, walk-in "completed" status), 15 passing tests
- [x] Week 9: Deployment-ready settings (Postgres via `DATABASE_URL`, whitenoise, env-based CORS/secrets) — see `DEPLOYMENT.md`
- [x] Week 10: Demo prep — see `DEMO_SCRIPT.md`

## Deployment

See `DEPLOYMENT.md` for step-by-step instructions to deploy this backend to
Render and the frontend to Vercel, so the project has a real public URL.

## Presenting this project

See `DEMO_SCRIPT.md` for a structured walkthrough script, including
anticipated questions.

## Notes

- Default DB is SQLite (`db.sqlite3`, zero setup). Switch to PostgreSQL later by
  changing `DATABASES` in `config/settings.py` (e.g. via `dj-database-url` + `DATABASE_URL` env var).
- `SECRET_KEY` reads from the `DJANGO_SECRET_KEY` env var in production; a dev
  fallback is included so it runs out of the box. Generate a real one with:
  `python -c "import secrets; print(secrets.token_urlsafe(50))"`
- `CORS_ALLOW_ALL_ORIGINS = True` is fine for development; restrict this
  (`CORS_ALLOWED_ORIGINS`) before deploying.
