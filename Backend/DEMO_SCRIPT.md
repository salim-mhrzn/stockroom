# Demo Script — Stockroom Inventory & Order Management

A ~5 minute walkthrough for presenting this project (to your internship
supervisor, in an interview, or recorded as a video). Follow this order —
it's designed to show the most impressive part (the business logic) at the
right moment, not just click through screens randomly.

---

## 0. Before you start

- Have the live Vercel URL open (or `localhost:5173` if not deployed yet)
- Have `/api/docs/` open in a second tab (impresses technical reviewers)
- Log out first, so you can demo the login flow

---

## 1. Open with the "what" (30 seconds)

> "This is an inventory and order management system I built — the kind of
> internal tool a small business would use to track products, suppliers,
> and orders. It's a full-stack app: Django REST Framework on the backend,
> React on the frontend."

## 2. Log in, show the dashboard (30 seconds)

Log in as admin. Point at:
- The low-stock alerts panel — "the system flags anything below a threshold automatically"
- Recent orders

> "This dashboard pulls live data from the API — nothing here is hardcoded."

## 3. Products — CRUD + the stock gauge (1 minute)

Go to Products.
- Point at the stock gauge bars — "amber means low stock, teal means healthy — designed so a warehouse worker can scan the list at a glance instead of reading numbers"
- Click **+ New product**, create one live
- Edit it, then show the low-stock threshold field

> "Only admin accounts can create or edit — staff accounts see the same data but read-only, and that's enforced on the backend, not just hidden in the UI."

*(Optional strong move: log out, log in as a staff account, show the buttons are gone — proves you understand the security isn't just cosmetic.)*

## 4. Orders — this is the centerpiece (2 minutes)

This is the part worth spending the most time on, because it's the actual engineering, not just CRUD.

1. Click **+ New order**
2. Pick a product, notice the stock count next to it in the dropdown
3. Place the order
4. Go back to Products — **point at the stock number that just changed**

> "When an order is placed, the backend validates there's enough stock for
> every item *before* creating anything. If there's not enough stock, the
> whole order is rejected — nothing partially happens. If it succeeds, stock
> gets decremented and every change is logged to an audit table, so there's
> always a record of *why* stock changed."

Then show an order failing:
5. Try to order more of something than is in stock
6. Show the clear error message, and that stock didn't change

> "This all runs inside a database transaction, so even if something failed
> halfway through, everything rolls back automatically — you can never end
> up with an order that exists but didn't actually update stock."

## 5. Show the API docs (1 minute)

Switch to the `/api/docs/` tab.

> "Every endpoint is documented automatically from the code — this isn't
> hand-written, it's generated from the same serializers and views that
> power the actual app, so it can't go out of date."

Optionally: expand `POST /api/orders/`, show the request/response schema.

## 6. Close with what's under the hood (30 seconds)

> "A few things I made sure were solid: role-based permissions enforced on
> the backend, JWT authentication with automatic token refresh, 12
> automated tests covering the core business logic — including edge cases
> like ordering the same product across two line items — and it's deployed
> live on Render and Vercel with a Postgres database."

---

## Anticipate these questions

**"What was the hardest part?"**
> The order logic — making sure stock validation and decrementing happen
> atomically, and catching an edge case where splitting one product across
> two line items in the same order could bypass the stock check if each
> line was validated independently instead of combined.

**"What would you do differently / what's left?"**
> Add automated frontend tests, move fully off SQLite in dev too, add rate
> limiting on login, and build out reporting (sales over time, etc.).

**"Why Django over something else?"**
> It was specified for the internship, but it turned out to be a good fit —
> the built-in admin panel gave a working management UI for free, and
> Django REST Framework's serializer validation made the stock-checking
> logic straightforward to write correctly.

---

## If a live demo breaks

Have a backup: a 2–3 minute **screen recording** of this same flow, done
once when everything worked, as insurance against WiFi/deployment hiccups
during a real presentation.
