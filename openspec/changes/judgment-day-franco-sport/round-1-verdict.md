# Round 1 Verdict — Judgment Day Franco Sport

**Date**: 2026-05-06
**Judges**: Judge A, Judge B (independent blind review)
**Status**: Synthesized — awaiting user approval before fixes

---

## Confirmed Issues (both judges agree)

### CRITICAL

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 1 | **Payment proof upload IDOR** — any authenticated user can upload proof for another user's order | `FrancoSport-API/src/controllers/payment.controller.js` ~L32-72 | No ownership check on `orderId` |
| 2 | **Cloudinary image deletion lacks authorization** — no admin/ownership check before deleting images | `FrancoSport-API/src/routes/upload.routes.js` ~L23, upload controller | Unauthenticated or unprivileged deletion possible |
| 4 | **Order cancellation stock restoration is not transactional** — stock can desync if partial failure occurs | `FrancoSport-API/src/controllers/order.controller.js` ~L170-210, admin orders controller | Judges disagreed on severity (CRITICAL vs WARNING); elevated to CRITICAL for data integrity |

### HIGH

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 3 | **Frontend `.env` tracked in git** — `.gitignore` does not ignore env files | `FrancoSport-web/.env`, `FrancoSport-web/.gitignore` | Judges disagreed on severity (CRITICAL vs WARNING); settled at HIGH |

### WARNING

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 5 | Refresh-token lifecycle weakness — no rotation/revocation, fallback to shared secret | `FrancoSport-API/src/controllers/auth.controller.js`, `FrancoSport-API/src/utils/jwt.js` | |
| 6 | Admin product update lacks validation and whitelisting | `FrancoSport-API/src/routes/admin/products.routes.js`, `FrancoSport-API/src/controllers/admin/products.controller.js` | |
| 7 | Weak hardcoded seed credentials | `FrancoSport-API/prisma/seed.js` | |
| 8 | Duplicate `total_amount` in order creation (client-sent vs server-computed) | `FrancoSport-API/src/controllers/order.controller.js` | |
| 9 | Multiple PrismaClient instances vs singleton | Various backend files | Classification differed between judges |
| 10 | VAPID private key logging if env var missing | Backend startup | Classification differed between judges |
| 11 | Low-stock query likely invalid — cross-field Prisma comparison | Admin/product queries | |
| 14 | Debug/dev artifacts committed | Various | Judges split between SUGGESTION and WARNING |

### SUGGESTION

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 12 | Missing automated tests and CI | Project-wide | High DX risk despite low runtime severity |
| 13 | Inconsistent error response formats | Backend controllers | |
| 15 | Expired seed coupons | `FrancoSport-API/prisma/seed.js` | |

---

## Suspect / Not Confirmed (flagged by one judge or needs deeper investigation)

| Issue | Location | Risk |
|-------|----------|------|
| Variant nullable price can become 0 in order total calculation | Order controller, product variants | Financial correctness |
| Stock decrement and loyalty points redemption may be race-condition unsafe | Order and loyalty controllers | Data integrity under concurrency |
| Missing item quantity validation — negative quantities possible in orders/cart | Order and cart controllers | Business logic bypass |
| Coupon deletion references `used_count` instead of `times_used` | Coupon controller | Runtime error / dead code |
| Shipping cost hardcoded to 0 despite shipping methods existing | Order creation | Business logic gap |
| No coupon validation/application in order creation flow | Order controller | Feature gap / revenue loss |
| AI chat endpoint needs stricter per-endpoint rate limiting | AI chat routes | Abuse / cost risk |
| Frontend `AdminRoute` trusts persisted client state until server revalidation | `FrancoSport-web` routing | Privilege escalation UX (not backend bypass) |

---

## Severity Disagreements Resolved

| Issue | Judge A | Judge B | Final |
|-------|---------|---------|-------|
| #3 Frontend `.env` tracked | CRITICAL | WARNING | **HIGH** — secrets exposure is real but scope is frontend-only |
| #4 Non-transactional stock restore | WARNING | CRITICAL | **CRITICAL** — data integrity loss is unrecoverable |
| #9 Multiple PrismaClient | WARNING | SUGGESTION | **WARNING** — connection pool exhaustion in production |
| #10 VAPID key logging | WARNING | SUGGESTION | **WARNING** — secret leak in logs |
| #14 Debug artifacts | SUGGESTION | WARNING | **WARNING** — increases attack surface |

---

## Next Step

**Awaiting user approval before applying any fixes.**
No source code will be modified until the user reviews and approves the confirmed findings above.
