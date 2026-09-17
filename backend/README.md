# AYNAM backend

API-only Next.js app: the public contact email pipeline **and** the internal
CRM API (auth, leads, employees, imports, exports, templates, automations,
notifications, activities, settings, dashboard stats). No pages — every route
lives under `/api/**`. Designed to deploy as a single web service on **Render**.

## Local

```bash
npm install
cp .env.example .env.local     # then edit; or use AYNAM_DEV_MONGO=1 + maildev
npm run dev                    # http://localhost:4000
```

Health check: `GET /api/health` (unauthenticated).

## Render deployment

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm install && npm run build` |
| Start command | `npm run start` |
| Health check path | `/api/health` |
| Instance type | any (single instance; rate limits + scheduler are in-process) |

Environment: everything from `.env.example`. Set `CORS_ORIGINS` to your two
frontend origins (website + crm subdomain). Point DNS e.g. `api.aynam.in` at
the Render service, then set `CORS_ORIGINS=https://aynam.in,https://crm.aynam.in`
and `COOKIE_DOMAIN=.aynam.in` so the session cookie is shared same-site.

## Notes

- Email provider is isolated in `lib/email/transporter.ts`; swap Gmail for
  Resend/Postmark/SES there without touching routes.
- First boot creates the main admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  (bcrypt-hashed) and seeds templates + default automations.
- A 60-second scheduler sweep fires `lead.followup_due` automations.
- Production refuses to boot without `MONGODB_URI`; `AYNAM_DEV_MONGO=1`
- enables an embedded temp-dir MongoDB for local work only.
