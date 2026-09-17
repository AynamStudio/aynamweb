# AYNAM Production Deployment Checklist

Domains (confirmed):

| Subdomain | Service | Hosting |
|---|---|---|
| `api.aynam.in` | Express backend | Render / VPS |
| `crm.aynam.in` | CRM Next.js frontend | Vercel |
| `aynam.in`, `www.aynam.in` | Marketing site | Vercel |

---

## 1. Backend (`api.aynam.in`) environment variables

Copy these into the Render (or your host) service environment. **Do not commit secrets.**

```ini
# --- Runtime ---
NODE_ENV=production

# --- Database ---
# MongoDB Atlas connection string (whitelist Render egress IPs or allow 0.0.0.0/0).
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/aynam-crm?retryWrites=true&w=majority

# --- Admin (first login) ---
JWT_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=owner@aynam.in
ADMIN_PASSWORD=<strong-password>

# --- CORS (comma-separated) ---
# Must include all production frontend origins.
CORS_ORIGINS=https://aynam.in,https://www.aynam.in,https://crm.aynam.in

# --- Cookie (critical for cross-subdomain auth) ---
# Without COOKIE_DOMAIN=.aynam.in the CRM cannot send the auth cookie
# from crm.aynam.in → api.aynam.in and every request will 401.
COOKIE_DOMAIN=.aynam.in

# --- Public URLs (used in emails / banners) ---
AYNAM_SITE_URL=https://aynam.in
AYNAM_ASSETS_URL=https://images.aynam.in
AYNAM_CONTACT_EMAIL=hello@aynam.in

# --- Outbound email (pick one) ---
# Option A — Gmail SMTP (requires a Google *App Password*, NOT your regular
# password). Regular passwords fail with "535-5.7.8 Username and Password not
# accepted" because Google blocks them for "less secure apps".
# Create an App Password at https://myaccount.google.com/apppasswords
# (requires 2FA enabled on the account first).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=hello@aynam.in
SMTP_PASSWORD=<16-char-google-app-password>   # e.g. xxxxxxxxxxxxxxxx

# Option B — Resend (recommended; HTTP API, avoids SMTP egress blocks).
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=AYNAM <hello@aynam.in>

# --- Rate limits (defaults sensible for prod; adjust if needed) ---
RATE_LIMIT_MAX=3
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_COOLDOWN_MS=20000
LOGIN_RATE_MAX=6
LOGIN_RATE_WINDOW_MS=600000
```

### SMTP 503 root cause

The current prod error `POST /api/contact → 503` with Gmail's
`535-5.7.8 Username and Password not accepted` is **not a code bug** — the
code correctly detects SMTP failure and returns 503. The fix is to:

1. Enable 2-Step Verification on the sending Gmail account.
2. Generate a 16-character **App Password** at
   https://myaccount.google.com/apppasswords
3. Put that App Password in `SMTP_PASSWORD` (NOT the account password).

If you'd rather not rely on Gmail, set `RESEND_API_KEY` and `EMAIL_FROM` and
remove the `SMTP_*` vars — the email service auto-detects whichever is
configured.

---

## 2. CRM (`crm.aynam.in`) — Vercel

The CRM no longer uses `NEXT_PUBLIC_API_URL`. It proxies `/api/*` through
Next.js rewrites so the backend origin never leaks to the browser.

In Vercel → crm project → Settings → Environment Variables, set **one** var:

| Name | Value | Environments |
|---|---|---|
| `API_URL` | `https://api.aynam.in` | Production, Preview |

The `crm-frontend/next.config.ts` rewrites all `/api/:path*` requests to
`${API_URL}/api/:path*`, so client-side code just calls `/api/...`.

### Vercel build note (the bug we fixed)

Build previously failed with:

```
Error: Expected an opening parenthesis.
  at static/css/1c30e5bb68865f50.css:1485:36
```

Root cause: `globals.css` contained Tailwind-style escaped arbitrary-value
selectors (`.bg-fg\/\[\.04\]`, `.placeholder\:text-fog-muted\/60::placeholder`)
whose bracket-in-escaped-name tripped Next's `cssnano-simple` minifier.
Fixed by removing those selectors and re-adding the classes that page JSX
uses as plain (un-escaped, no-bracket) utility aliases. `next build` passes
cleanly now.

---

## 3. Marketing site (`aynam.in`, `www.aynam.in`) — Vercel

The contact form posts to same-origin `/api/contact` (Next server route),
which proxies to the backend using the server-only `API_URL` env var.

Set in Vercel → aynam project → Settings → Environment Variables:

| Name | Value | Environments |
|---|---|---|
| `API_URL` | `https://api.aynam.in` | Production, Preview |

No env var is exposed to the browser bundle.

### Works section

Internal R&D entries (AGENTS, CyberSentinel, CODE Classroom, JobOS) and the
"Experiments — Internal R&D" section on `/work` have been removed; only the
CIGN (CyFirms Intelligence Network) case study remains plus the "Additional
case studies will be published as client work ships" line.

---

## 4. DNS / HTTPS

* `api.aynam.in` → Render service (or your VPS). Render provisions HTTPS automatically.
* `crm.aynam.in`, `aynam.in`, `www.aynam.in` → Vercel.
* Ensure all four are HTTPS; the cookie has `Secure` when `NODE_ENV=production`.
* Do NOT set `COOKIE_DOMAIN=api.aynam.in` — must be `.aynam.in` (leading dot) so
  `crm.aynam.in` shares the session cookie with `api.aynam.in`.

---

## 5. Post-deploy smoke test

Run these in order:

```bash
# 1. Backend health
curl -s https://api.aynam.in/api/health | jq .

# 2. Marketing contact form (should create a lead; email may 503 only if
#    SMTP is truly broken — but the lead should still persist).
curl -i -X POST https://aynam.in/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Deploy Test","email":"test@example.com","message":"Production smoke test message long enough."}'

# 3. CORS — request from non-allowlisted origin must return 403, not 500
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.aynam.in/api/contact \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  -d '{"name":"x","email":"e@e.com","message":"aaaaaaaaaaaaa"}'
# → expected: 403

# 4. CRM login at https://crm.aynam.in/login → dashboard → Leads list.
#    If login succeeds but /api/leads returns 401, the cookie isn't
#    crossing subdomains — double-check COOKIE_DOMAIN=.aynam.in and that
#    NODE_ENV=production on the backend.
```

---

## 6. Local dev

```bash
# Terminal 1 — backend (embedded MongoDB, no Atlas needed)
cd backend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:4000

# Terminal 2 — CRM
cd crm-frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3001

# Terminal 3 — marketing site
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```
