# Deployment Guide

This gets your project a **real public URL** instead of only running on your
laptop. Backend goes on **Render** (free tier), frontend on **Vercel** (free
tier). Both just need a GitHub account and a few clicks — no credit card
required for the free tiers used here.

Total time: ~20–30 minutes.

---

## Step 0: Push your code to GitHub

Both Render and Vercel deploy from a GitHub repo, so you need your code there first.

1. Create a GitHub account if you don't have one: https://github.com/signup
2. Create **two** new repositories (empty, no README): `inventory-backend` and `inventory-frontend`
3. In your `Backend` folder:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/inventory-backend.git
   git push -u origin main
   ```
4. Repeat the same 5 commands inside your `Frontend` folder, pointing at `inventory-frontend` instead.

(If `git` isn't recognized, install it from https://git-scm.com/downloads first, same way you installed Node.)

---

## Step 1: Deploy the backend on Render

1. Go to https://render.com and sign up (use "Sign up with GitHub" — easiest)
2. Click **New +** → **Web Service**
3. Connect your `inventory-backend` GitHub repo
4. Fill in:
   - **Name:** `inventory-backend` (or anything)
   - **Runtime:** Python 3
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn config.wsgi:application`
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `DJANGO_SECRET_KEY` | *(generate one — see below)* |
   | `DJANGO_DEBUG` | `False` |
   | `DJANGO_ALLOWED_HOSTS` | `.onrender.com` |
   | `PYTHON_VERSION` | `3.12.0` |

   **To generate a secret key**, run this locally and paste the output:
   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

6. Click **New +** → **PostgreSQL** (separately) to create a free database
   - Once created, copy its **Internal Database URL**
   - Go back to your web service → Environment → add `DATABASE_URL` = *(that URL)*
7. Click **Create Web Service**. Render will run `build.sh` (installs deps, runs migrations, collects static files) and start the app.
8. Once deployed, your API is live at something like `https://inventory-backend-xxxx.onrender.com`

**Test it:** visit `https://your-backend-url.onrender.com/api/docs/` — you should see the same Swagger page you've been using locally.

**Create your admin user on the live database** — Render gives you a "Shell" tab on your service:
```bash
python manage.py seed_demo_data
```

---

## Step 2: Deploy the frontend on Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click **Add New** → **Project**
3. Import your `inventory-frontend` repo
4. Vercel auto-detects it's a Vite project — leave build settings as default
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-backend-url.onrender.com/api` |

   (Use your **actual** Render URL from Step 1, with `/api` on the end.)
6. Click **Deploy**

Once done, you'll get a live URL like `https://inventory-frontend-xxxx.vercel.app` — **this is the link you send people.**

---

## Step 3: Connect them (finish the CORS setup)

Right now Django will reject requests from your new Vercel URL unless you tell it to allow them.

1. Go back to Render → your backend service → Environment
2. Add:
   | Key | Value |
   |---|---|
   | `DJANGO_CORS_ALLOWED_ORIGINS` | `https://your-frontend-url.vercel.app` |
3. Save — Render will automatically redeploy with the new setting

---

## Step 4: Verify it all works

1. Open your Vercel URL
2. Log in with `admin` / `admin12345` (from the seed command)
3. Create a product, place an order — confirm it works exactly like it did locally

If login fails or you see network errors in the browser console (F12 → Console tab), it's almost always one of:
- `VITE_API_BASE_URL` doesn't match your real Render URL exactly (check for typos, trailing slashes)
- `DJANGO_CORS_ALLOWED_ORIGINS` doesn't match your real Vercel URL exactly
- The Render free tier "spun down" from inactivity — free services sleep after 15 min idle and take ~30–60 seconds to wake up on the next request. This is normal, not a bug.

---

## What you now have

- A real public URL you can send to anyone (no need for them to install Python/Node)
- A live PostgreSQL database (not the local SQLite file)
- The exact same codebase running the exact same tests you already wrote

This is genuinely deployment — the same category of task you'd do at a real job, just on free-tier infrastructure instead of a company's paid cloud account.
