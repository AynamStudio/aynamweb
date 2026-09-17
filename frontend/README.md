# AYNAM — Official Website

Production website for **AYNAM**, an independent software studio.
Dark editorial monochrome system, architectural photography, restrained motion.

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · GSAP + ScrollTrigger · Lenis**

---

## Monorepo map (production split)

> Full map + deploy checklist: see the repo-root README.md.

| Folder | What | Deploys to | Port (dev) |
| --- | --- | --- | --- |
| `frontend/` (this folder) | Public marketing website; contact form POSTs to the backend | Vercel (root dir `frontend`) | 3000 |
| `/backend` | API-only Next app: contact email pipeline + whole CRM API (`/api/**`), MongoDB, scheduler | Render | 4000 |
| `/crm-frontend` | Internal dashboard UI (leads, employees, imports, templates, automations, activities, settings) | Vercel (subdomain, e.g. `crm.aynam.in`) | 3001 |

Cross-app contract: frontends call `NEXT_PUBLIC_API_URL` with
`credentials: "include"`; the backend echoes allowed origins from
`CORS_ORIGINS` and sets the session cookie (`COOKIE_DOMAIN=.aynam.in` in
production keeps it same-site across subdomains). Each folder has its own
`package.json`, `.env.example` and README with deploy settings.

Run all three locally:

```bash
# terminal 1 — backend
cd backend && npm install && npm run dev        # :4000  (add AYNAM_DEV_MONGO=1 to .env.local for embedded Mongo)
# terminal 2 — website (this folder)
npm install && npm run dev                      # :3000  (.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000)
# terminal 3 — crm
cd crm-frontend && npm install && npm run dev   # :3001  (.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000)
# optional: npx maildev  → mail catcher at :1080
```

---

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run start      # production server
npm run typecheck  # tsc --noEmit
npm run lint
```

## Routes

| Route        | Content                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `/`          | Full-bleed cinematic hero → Capabilities → Featured Work → Industries → Why AYNAM → CTA |
| `/work`      | CITN ERP modernization case study + Experiments (internal R&D, explicitly not client work) |
| `/services`  | Four capabilities in editorial rows + "How we work" process              |
| `/industries`| Six industry tiles with fit-lines                                        |
| `/contact`   | Direct channels (@aynam), what-happens-next, monochrome sphere           |

Shared black page-transition (white AYNAM lockup) between routes; `/#partners` deep-links
from any route to the Why AYNAM section on the home page.

## Visual system — editorial light/dark rhythm

The site is a single integrated monochrome publication with an intentional
surface sequence (no user theme toggle):

    DARK hero → LIGHT capabilities → SOFT-LIGHT featured work (DARK CITN panel)
    → DARK industries → LIGHT why-aynam → DEEP contact → BLACK footer

- Surfaces (`.s-dark .s-deep .s-light .s-soft .s-black` in `app/globals.css`)
  re-scope the CSS-variable tokens (`ink`, `fog`, `line`, `fg`, `scrim`, `card`),
  so every token-driven utility inside a section recolours automatically.
  Palette: dark `#070707`, deep `#050505`, black `#000`, light `#F5F5F2`,
  soft `#EAEAE6`, cards `#FFFFFF`, borders `rgba(0,0,0,.12)` / `rgba(255,255,255,.14)`.
- Sections declare `data-surface`; the fixed nav probes the surface at its own
  height (`lib/useNavSurface.ts`) and cross-fades logo/links/CTA over ~500ms.
- Cursor + scroll rail use `mix-blend-difference`: they invert continuously
  against whatever surface or photograph sits beneath them.
- Buttons adapt per surface: white-filled on dark, black-filled on light.
- Contact/close CTA: interactive monochrome 3D Earth (`components/contact/EarthGlobe.tsx`,
  three.js + @react-three/fiber, dynamic import, ssr:false): ~50s rotation,
  ≤4° pointer drift, ScrollTrigger entrance (opacity/scale), matte standard
  material, key + rim light only. Static monochrome fallback image when WebGL
  is unavailable or reduced motion is set; lower sphere segments on mobile.
  Texture: NASA-derived equirectangular map treated to high-contrast monochrome
  (`public/textures/earth-mono.jpg`, fallback render `earth-fallback.jpg`).

## Content & truthfulness policy

All copy lives in **`lib/constants.ts`** — the single source of truth.

- No invented clients, metrics, testimonials, partners, team or awards.
- The only client case study is **CITN** (ERP modernization, live at citn.in,
  SQL Server 2025 data platform, Next.js + Express.js).
- `AGENTS`, `CyberSentinel`, `CODE Classroom`, `JobOS` appear only under
  **EXPERIMENTS — INTERNAL R&D**, never as client work.

### Swap-points before launch

| What                  | Where                                   |
| --------------------- | --------------------------------------- |
| Public inbox (empty = contact page shows "inbox being set up" note; set it and a mailto button renders) | `CONTACT_EMAIL` in `lib/constants.ts` |
| Social URLs (`@aynam`) | `SOCIALS` in `lib/constants.ts`         |
| Domain (`aynam.com` placeholder in metadataBase / sitemap / robots) | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| Any copy, tags, industries, principles | `lib/constants.ts` |

## Design tokens

- Backgrounds `#050505 / #090909 / #0D0D0D`, borders `rgba(255,255,255,0.12)`
- Text `#F5F5F5 / #8A8A8A / #5F5F5F`, accent white only
- One type family: **Geist** (self-hosted via `next/font`), fluid `clamp()` scale
- 12-column editorial grid, max width 1440px, padding 20 / 32 / 48px
- Film-grain overlay, hairline rules, masked line reveals, clip-path image wipes

## Motion system (`components/motion/`)

`TransitionProvider` (Lenis + page transitions) · `RevealLines` · `FadeUp` ·
`ImageReveal` · `Parallax` · `Magnetic` · `TransitionLink` · `SectionHead`,
plus `components/ui/Cursor` (dot + ring, `VIEW →` / `EXPLORE` labels) and
`ScrollProgress` (hairline on the right edge).

Everything honours `prefers-reduced-motion`; cursor/parallax are disabled on
coarse pointers; no layout-triggering properties are animated.

## Brand assets

`public/brand/` — logo mark + lockups processed from the supplied artwork
(white-on-transparent), favicon/icons generated from the mark.
`app/icon.png` + `app/apple-icon.png` wire up the favicon.

## Imagery

Real photography from **Unsplash** (Unsplash licence — free for commercial use,
no attribution required), monochrome-treated in CSS. Source photo IDs:

| Slot            | Unsplash photo id        |
| --------------- | ------------------------ |
| hero (full-bleed, supplied by studio) | `public/images/hero-cinematic.jpg` (+ `-mobile` art-directed crop) |
| capabilities/web| 1493397212122-2b85dda8106b |
| capabilities/ai | 1518770660439-4636190af475 |
| capabilities/business | 1497366216548-37526070297c |
| capabilities/legacy | 1504917595217-d4dc5ebe6122 |
| work/citn       | 1558494949-ef010cbdcc31 |
| industries/manufacturing | 1513828583688-c52646db42da |
| industries/automotive | 1492144534655-ae79c964c9d7 |
| industries/education | 1481627834876-b7833e8f5570 |
| industries/finance | 1449157291145-7efd050a4d0e |
| industries/healthcare | 1516549655169-df83a0774514 |
| industries/technology | 1544197150-b99a580bb7a8 |
| why-aynam       | 1497366811353-6870744d04b2 |

## Structure

```
app/            routes, layout, globals, icon, sitemap, robots
components/     navigation/ hero/ capabilities/ featured-work/
                industries/ why-aynam/ contact/ footer/ motion/ ui/ webgl/
                work/ services/
lib/            constants.ts (all copy) · utils.ts · motion/ (gsap, prefs)
public/         brand/ images/
```

## Contact email system (SMTP)

> Implementation now lives in `backend/` (lib/email + /api/contact). The notes below still describe the behaviour.

Production contact form → `POST /api/contact` → Nodemailer (Gmail SMTP) →
two branded, table-based responsive HTML emails:

1. **Admin notification** to `AYNAM_CONTACT_EMAIL` — subject `New AYNAM enquiry — {name}`,
   `Reply-To` set to the enquirer so replies go straight to them.
2. **User confirmation** to the submitter — subject `AYNAM — We've received your message`,
   branded banner across the top of the card.

### Setup

1. Enable Google 2-Step Verification, then create a **Google App Password**
   (Account → Security → App passwords). Never use your normal Gmail password.
2. `cp .env.example .env.local` and fill in `SMTP_*`, `AYNAM_CONTACT_EMAIL`,
   `AYNAM_SITE_URL`. `.env.local` is git-ignored — never commit secrets.
3. `npm run dev`, submit the form at `/contact`, verify both inboxes.

### Guarantees

- Credentials are server-side only: never in client bundles, API responses,
  rendered HTML, or logs (errors log message text only).
- Validation (name 2–100, message 10–5000, email/phone formats, allow-listed
  project/budget values), HTML-escaping of every user value in email HTML,
  honeypot field (`website`) silently dropped, in-memory per-IP rate limit
  (3 / 10 min + 20 s cooldown), double-submit protection in the form UI.
- Delivery order: admin first, then user confirmation. Admin failure → HTTP 500;
  user-confirmation failure → HTTP 200 with `confirmationSent: false` so partial
  failure is never disguised.
- Local SMTP testing without Gmail: point `SMTP_HOST/PORT` at a dev server such
  as Maildev (`npx maildev --smtp 1025 --web 1080`, `SMTP_SECURE=false`).

## Internal CRM / business OS

> Split for production: API + email in `backend/`, dashboard UI in `crm-frontend/` (routes rebased from `/admin/*` to `/`). The design notes below still apply.

The same Next app ships a private internal system at `/admin` — leads, employees,
imports, templates, automations, activity, settings. It is a modular monolith:
API route handlers are the backend, MongoDB (Mongoose) is the store, and every
permission is enforced server-side (UI hiding is only convenience).

### Architecture

- `lib/server/` — models (Lead, User, Note, Activity, EmailLog, EmailTemplate,
  Automation, Notification, ImportJob, AuditLog, Setting), `permissions.ts`
  (granular permission list + role presets), `auth.ts` (bcryptjs + JWT in an
  httpOnly cookie `aynam_sess`, 12 h), `guards.ts` (`requireUser("leads.edit")`
  → 401/403), `db.ts` (connect + first-run bootstrap), `audit.ts`.
- `lib/server/services/` — `emailService.ts` (single email entry point wrapping
  Nodemailer; swap the provider here without touching CRM/contact code),
  `leads.ts` (visibility scoping), `automation.ts` (trigger → conditions →
  actions engine), `scheduler.ts` (60 s follow-up sweep), `importStore.ts`.
- `app/api/**` — auth (login/logout/me), leads (+ assign/notes/email/bulk/
  export), employees, imports (+ commit/template), templates, automations,
  notifications, activities, settings, dashboard/stats.
- `middleware.ts` — redirects unauthenticated `/admin*` to `/admin/login`,
  adds `X-Robots-Tag: noindex,nofollow`, and rewrites a configured
  `ADMIN_HOST` subdomain to `/admin` (DNS + env only — no second app).
- `instrumentation.ts` — boots DB bootstrap + scheduler on server start.
- `components/admin/` + `app/admin/**` — the dashboard UI: light `#F5F5F2` /
  dark `#070707` scopes, editorial type, subtle borders, mobile-usable.

### Data rules

- Leads: sources WEBSITE / MANUAL / CSV_IMPORT / EXCEL_IMPORT; statuses
  NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON / LOST / ON_HOLD;
  priorities LOW/MEDIUM/HIGH/URGENT; soft delete; append-only activity timeline;
  per-lead email log with delivery status (contact leads persist even if SMTP fails).
- Visibility: SALES sees only assigned leads unless granted `leads.view_all`.
  Exports honour the same scope. Bulk actions and deletes check permissions per call.
- Imports: CSV/XLSX upload → preview → suggested + manual column mapping →
  per-row validation → duplicate policy (skip / update / create) → error report
  and stored import history. `GET /api/imports/template?format=csv|xlsx` downloads
  `AYNAM_LEADS_IMPORT_TEMPLATE` with an example row on a second sheet.
- Templates: `{{name}} {{company}} {{projectType}} {{assignedEmployee}}
  {{aynamSiteUrl}} {{email}}` resolved and HTML-escaped at send time; scripts and
  event handlers stripped on save; plain-text lines wrapped in the branded layout.
- Automations: triggers `lead.created / lead.assigned / lead.status_changed /
  lead.followup_due / lead.imported`; actions `send_email / assign_lead /
  change_status / create_activity / notify_employee`. Seeded defaults:
  assignment notification + follow-up reminder (sweep runs every 60 s).

### Auth & roles

- First boot creates the main ADMIN from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  (bcrypt-hashed; env only — never hardcoded, never logged).
- Employees get role labels (ADMIN / SALES / OPERATIONS / MANAGER) plus a
  granular permission array; creation returns a one-time temporary password.
  Roles are presets only — permissions are what the backend enforces.
- Login is rate-limited per IP and per email; sessions are JWTs in an httpOnly,
  SameSite=Lax cookie (`COOKIE_DOMAIN` optional for cross-subdomain sessions).

### Deployment (subdomain)

1. Deploy this same app once (Vercel/Node).
2. DNS: `crm.your-domain.com` → the deployment.
3. Env: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `ADMIN_HOST=crm.your-domain.com`, `COOKIE_DOMAIN=.your-domain.com`.
4. `https://crm.your-domain.com` now serves the dashboard; the public site is
   untouched and `/admin` on the main host keeps working.

### Local development without MongoDB

With `AYNAM_DEV_MONGO=1` and no `MONGODB_URI`, the app boots an embedded
mongodb-memory-server persisted in your OS temp dir (`aynam-mongo-dev`) —
dev convenience only; production refuses to boot without a real `MONGODB_URI`.

Quick local start (no Atlas, no real email):

```bash
npm install --legacy-peer-deps
# .env.local: AYNAM_DEV_MONGO=1, JWT_SECRET=<openssl rand -hex 32>,
#             ADMIN_EMAIL, ADMIN_PASSWORD, AYNAM_SITE_URL=http://localhost:3000,
#             SMTP_HOST=localhost SMTP_PORT=1025 SMTP_SECURE=false   (maildev)
npx maildev        # optional mail catcher, web UI http://localhost:1080
npm run dev        # CRM at http://localhost:3000/admin
```

First boot creates the admin from env, seeds templates + default automations.
Delete the `aynam-mongo-dev` temp folder to reset all CRM data.

### QA

- `qa30.js` (in the private QA harness) exercises the full critical flow
  end-to-end: contact → lead → assign → note/status → timeline → notification →
  CSV import with duplicate policy → scoped exports → template email through
  SMTP → rate limits → logout. Last run: 38/38 PASS.
- `qa28.js` keeps the public contact email suite green (24/24).
