# Franco Sport — E-Commerce Platform

Full-stack e-commerce platform for the Franco Sport clothing brand. Node.js/Express API with React/TypeScript storefront.

**Status:** Judgment Day audit **APPROVED** (May 2026) — zero critical issues, zero real warnings. See [Deferred Work](#deferred-work) for non-blocking items tracked for future sessions.

---

## Quick Start

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd E-Commerse-FrancoSport

# 2. Start the API (terminal 1)
cd FrancoSport-API
cp .env.example .env          # edit with your credentials
npm install
npm run db:push               # sync Prisma schema → MySQL
npm run db:seed               # seed demo data
npm run dev                   # http://localhost:3000

# 3. Start the frontend (terminal 2)
cd FrancoSport-web
cp .env.example .env          # edit if needed
npm install
npm run dev                   # http://localhost:5173
```

> Both `.env.example` files are committed and documented. **Never commit real `.env` files.**

---

## Repository Structure

| Path | What it is |
|------|-----------|
| `FrancoSport-API/` | Express + Prisma REST API (Node.js, MySQL) |
| `FrancoSport-web/` | React 18 + TypeScript + Vite storefront |
| `openspec/changes/judgment-day-franco-sport/` | Adversarial audit artifacts (proposal, fixes, verdict) |
| `.atl/skill-registry.md` | AI agent skill registry (Gentle AI / OpenCode conventions) |

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| MySQL | 8.0+ |
| npm | 9+ (ships with Node 18) |

Optional: Stripe test keys, Cloudinary account, Gmail app password for email features.

---

## Environment Setup

### API (`FrancoSport-API/.env.example`)

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default `3000`) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Token signing secret — **change in production** |
| `JWT_EXPIRES_IN` | Token TTL (default `7d`) |
| `JWT_REFRESH_SECRET` | **Required** — server fails fast without it |
| `STRIPE_SECRET_KEY` | Stripe test/live secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `FRONTEND_URL` | CORS allowed origin (default `http://localhost:5173`) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP for Nodemailer |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image hosting |

### Web (`FrancoSport-web/.env.example`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (default `http://localhost:3000/api/v1`) |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_APP_NAME` | Display name |
| `VITE_APP_SLOGAN` | Display slogan |

Feature flags (`VITE_ENABLE_WISHLIST`, `VITE_ENABLE_REVIEWS`, `VITE_ENABLE_COUPONS`) are optional and commented out by default.

---

## Scripts

### API (`FrancoSport-API/`)

| Script | Command | What it does |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start with nodemon (auto-reload) |
| `start` | `npm start` | Start in production mode |
| `db:push` | `npm run db:push` | Push Prisma schema to MySQL |
| `db:seed` | `npm run db:seed` | Seed demo data (users, products, categories) |
| `db:studio` | `npm run db:studio` | Open Prisma Studio at `localhost:5555` |

### Web (`FrancoSport-web/`)

| Script | Command | What it does |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server |
| `build` | `npm run build` | TypeScript check + Vite production build |
| `lint` | `npm run lint` | Run ESLint |
| `preview` | `npm run preview` | Preview production build locally |
| `type-check` | `npm run type-check` | TypeScript `--noEmit` check |

---

## Architecture Summary

### API

```
FrancoSport-API/src/
├── server.js              # Entry point, Express app setup
├── socket.js              # Socket.IO setup (real-time events)
├── config/                # App configuration
├── controllers/           # Request handlers (auth, cart, order, payment, product, ...)
│   └── admin/             # Admin-specific controllers
├── middleware/             # Auth (JWT), validation, error handling, rate limiting
├── routes/                # Route definitions (mirrors controllers)
│   └── admin/             # Admin routes
├── services/              # Business logic services
├── scripts/               # Utility scripts
└── utils/                 # Prisma singleton, JWT helpers
```

**Key patterns:**
- Prisma singleton (`src/utils/prisma.js`) — all files import from here, not `new PrismaClient()`.
- JWT auth middleware with role-based guards (`ADMIN`, `CUSTOMER`, `MODERATOR`).
- Helmet, CORS, and express-rate-limit enabled globally.
- Transactional order cancellation with stock restoration.

### Web

```
FrancoSport-web/src/
├── api/                   # Axios API client layer
├── components/            # Reusable UI components
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── pages/                 # Route pages (Home, Products, Cart, Checkout, Profile, admin/...)
├── schemas/               # Zod validation schemas
├── store/                 # Zustand stores (auth, cart, order, products, ui, wishlist)
├── types/                 # TypeScript type definitions
└── utils/                 # Shared utilities
```

**Key patterns:**
- Zustand for global state (auth, cart, orders, products, UI, wishlist).
- Zod + React Hook Form for client-side validation.
- Axios API layer with interceptors.
- Tailwind CSS for styling, Framer Motion for animations.
- Admin panel under `pages/admin/`.

### Integrations

| Integration | Purpose |
|-------------|---------|
| Stripe | Payment processing (API + React Stripe.js) |
| Cloudinary | Product image upload and hosting |
| Socket.IO | Real-time notifications |
| Nodemailer | Transactional email |
| Gemini API | AI-powered features (product recommendations, chat) |
| Web Push | Browser push notifications |

---

## Security Notes (from Judgment Day audit)

The following issues were found and **fixed** during the adversarial audit:

| Area | Fix Applied |
|------|-------------|
| Payment proof IDOR | Added `userId` ownership check |
| Cloudinary upload/delete | Restricted to admin role |
| Order cancellation | Transactional with stock restoration; `CANCELLED` blocked from generic status update |
| `.env` committed | Added to `.gitignore`, removed from git index |
| `JWT_REFRESH_SECRET` | Server fails fast on startup if missing |
| Product update | Field whitelist + input validation |
| Seed credentials | Read from env vars, not hardcoded |
| Prisma client | Singleton pattern across all 13+ files |
| VAPID key logging | Replaced with fail-fast validation, no key in output |
| Debug PII logging | Removed `console.log` statements leaking user data |
| SQL syntax | Fixed PostgreSQL-style quoting to MySQL backticks |

**Env hygiene:** Never commit `.env` files. The `.env.example` files contain placeholder values only. Rotate any secrets that may have been exposed in git history.

---

## Testing & CI

**Status: Not yet implemented.**

There are no automated tests or CI pipelines. This is tracked as deferred work.

Recommended next steps:
- Add unit tests for controllers and middleware (Jest or Vitest).
- Add integration tests for critical flows (auth, order, payment).
- Add `npm run lint` and `npm run type-check` to a CI pipeline.
- Add `npm run build` verification for the frontend.

---

## Deferred Work

Non-blocking items identified during the Judgment Day audit, tracked for future work:

- [ ] `.env` git history cleanup (if real secrets existed — requires `git filter-branch` or BFG)
- [ ] Refresh token rotation/revocation (requires schema migration)
- [ ] Automated tests and CI pipeline
- [ ] Consistent error response format across all controllers
- [ ] Debug/dev script cleanup (`check_zones.js`, `debug_auth.js`, `debug_import.js`, etc.)
- [ ] Optional `globalThis` Prisma guard for hot-reload dev environments
- [ ] Decimal precision review for currency amounts

---

## Review Checklist

For reviewers evaluating this project:

- [ ] Both `.env.example` files have all required variables documented
- [ ] `JWT_REFRESH_SECRET` is set (server will refuse to start without it)
- [ ] Database is seeded and API responds at `/api/health`
- [ ] Frontend connects to API and renders product listing
- [ ] Stripe test mode works for checkout flow
- [ ] Admin panel accessible at `/admin` with admin credentials
- [ ] Order cancellation restores stock (transactional)
- [ ] Upload/delete routes require admin role
- [ ] No `.env` files committed to the repository

---

## Audit Artifacts

Full adversarial audit documentation is in `openspec/changes/judgment-day-franco-sport/`:

| File | Content |
|------|---------|
| `proposal.md` | Audit scope and approach |
| `tasks.md` | Task checklist with all fixes |
| `fixes-round-1.md` | Round 1 fix details (12 issues) |
| `round-1-verdict.md` | Judge findings after Round 1 |
| `fixes-round-2.md` | Round 2 fix details (3 issues) |
| `final-verdict.md` | Final verdict: APPROVED |

Persistent context from the audit is also saved in **Engram** (project: `franco-sport`).

---

**Author:** Pedro Fabricio  
**License:** MIT  
**Version:** 1.0.0
