# AYNAM CRM frontend

The internal dashboard UI (leads, employees, imports, templates, automations,
activities, settings) as a standalone Next.js app. **No backend code lives
here** — every call goes to `NEXT_PUBLIC_API_URL` with credentials, so the
session cookie set by the backend is sent along.

## Local

```bash
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                   # http://localhost:3001
```

Login at `/login`; the app redirects there automatically on 401.

## Vercel deployment

| Setting | Value |
| --- | --- |
| Root directory | `crm-frontend` |
| Framework | Next.js |
| Build / output | defaults |
| Env | `NEXT_PUBLIC_API_URL=https://api.aynam.in` |

Deploy on a subdomain of the main site (e.g. `crm.aynam.in`) so the backend
session cookie (domain `.aynam.in`, SameSite=Lax) is same-site for the
browser. Add both frontend origins to the backend's `CORS_ORIGINS`.

## Theming

Light `#F5F5F2` / dark `#070707` scopes via the topbar toggle, persisted in
`localStorage`. Mobile-first shell: sidebar on desktop, horizontal nav on
small screens.
