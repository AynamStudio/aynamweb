# AYNAM — monorepo

Production home of **AYNAM** (independent software studio): public website,
internal CRM and the API backend that powers both. One repo, three
independently deployable Next.js 15 apps.

| Folder | What | Deploys to | Dev port |
| --- | --- | --- | --- |
| `frontend/` | Public marketing website (dark editorial monochrome system). Contact form POSTs to the backend API | Vercel — root directory `frontend` | 3000 |
| `crm-frontend/` | Internal dashboard UI: leads, employees, imports, templates, automations, activities, settings. No backend code — calls `NEXT_PUBLIC_API_URL` with credentials | Vercel — root directory `crm-frontend`, on a subdomain (e.g. `crm.aynam.in`) | 3001 |
| `backend/` | API-only Next app: contact email pipeline (Gmail SMTP), whole CRM API (`/api/**`), MongoDB (Mongoose), auth (JWT httpOnly cookie), scheduler, CORS | Render — root directory `backend`, health path `/api/health` | 4000 |

## Cross-app contract

- Frontends call `NEXT_PUBLIC_API_URL` with `credentials: "include"`.
- Backend echoes allowed origins from `CORS_ORIGINS` (comma-separated) and
  sets the `aynam_sess` cookie; in production set `COOKIE_DOMAIN=.aynam.in`
  so website/crm/api subdomains share it same-site (SameSite=Lax).
- Each app owns its `package.json`, `.env.example`, `.env.local` (git-ignored)
  and README with exact deploy settings.

## Run everything locally

```bash
# 0 — optional mail catcher (sees every email the backend sends)
npx maildev                      # web UI http://localhost:1080, SMTP 1025

# 1 — backend
cd backend && npm install
#    backend/.env.local: AYNAM_DEV_MONGO=1 + SMTP_* pointing at maildev, or real values
npm run dev                      # http://localhost:4000

# 2 — public website
cd frontend && npm install
#    frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                      # http://localhost:3000

# 3 — crm dashboard
cd crm-frontend && npm install
#    crm-frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                      # http://localhost:3001 → /login
```

First backend boot creates the main admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
(bcrypt-hashed), seeds email templates + default automations, and starts the
60-second follow-up sweep. `AYNAM_DEV_MONGO=1` runs an embedded MongoDB in your
OS temp dir — no database install needed for local work; production refuses to
boot without a real `MONGODB_URI`.

## Production checklist

1. MongoDB Atlas: allowlist the Render service IP (and your office IP for local).
2. Render: create web service from `backend/`, set env (see `backend/.env.example`),
   health check `/api/health`. DNS `api.your-domain` → Render.
3. Vercel: import repo twice — root `frontend/` (DNS apex/www) and root
   `crm-frontend/` (DNS `crm.`). Set `NEXT_PUBLIC_API_URL=https://api.your-domain` on both.
4. Backend env: `CORS_ORIGINS=https://your-domain,https://crm.your-domain`,
   `COOKIE_DOMAIN=.your-domain`, real `JWT_SECRET` (openssl rand -hex 32),
   strong `ADMIN_PASSWORD`, Gmail app password, `AYNAM_SITE_URL`.
5. Verify: submit `/contact` → lead in CRM + two branded emails; log in at `crm.` subdomain.

## Truthfulness & design policy (short version)

No fabricated stats/clients/testimonials; monochrome authority (exceptions:
CITN screenshot + capability artworks in full colour); no grey wash on imagery;
editorial type, hairline borders, restrained GSAP/Lenis motion; CRM mirrors the
same visual language in light `#F5F5F2` / dark `#070707`.
