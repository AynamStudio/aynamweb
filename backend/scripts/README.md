# scripts/ — backend one-shot utilities

## `create-admin.mjs`

Upserts a full-permission ADMIN user directly against MongoDB. Does **not**
need the backend/Next server running. Uses Mongoose + bcryptjs already in
`backend/node_modules` — no new installs.

### Quick start (for your current dotenv block)

From inside `backend/`:

```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/aynam-crm?retryWrites=true&w=majority" \
ADMIN_EMAIL="owner@aynam.in" \
ADMIN_PASSWORD="Akshit123@098" \
node scripts/create-admin.mjs
```

Or add those three vars to `backend/.env.local` and run:

```bash
npm run create-admin
```

### Other invocations

```bash
# positional args (uri, email, password)
node scripts/create-admin.mjs "mongodb+srv://..." "owner@aynam.in" "Akshit123@098"

# target the local embedded dev Mongo (requires a recent `npm run dev` with
# AYNAM_DEV_MONGO=1 so uri.json exists in the OS temp dir):
node scripts/create-admin.mjs --dev owner@aynam.in Akshit123@098
```

### Behaviour

- If an ADMIN with that email exists → **updated** (password rehashed, status
  forced ACTIVE, permissions topped up to the full set).
- If not → **created** as a new ADMIN with every permission.
- Other admins are untouched — no lockout risk.
- Prints the inserted/updated user id and total active admin count.
