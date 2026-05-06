# Judgment Day — Round 1 Fixes Applied

## CRITICAL Fixes

### 1. Payment proof upload IDOR
- **File**: `FrancoSport-API/src/controllers/payment.controller.js:53-59`
- **Fix**: Added ownership check (`order.user_id !== req.user.id`) with admin exception before allowing payment proof upload.

### 2. Cloudinary image deletion lacks admin authorization
- **File**: `FrancoSport-API/src/routes/upload.routes.js:23`
- **Fix**: Added `requireAdmin` middleware to `DELETE /api/upload/image/:publicId` route.

### 3. Order cancellation stock restoration not transactional
- **Files**:
  - `FrancoSport-API/src/controllers/order.controller.js:170-210`
  - `FrancoSport-API/src/controllers/admin/orders.controller.js:394-428`
- **Fix**: Wrapped both user and admin cancellation flows (status update + stock restoration + history creation) in `prisma.$transaction()`.

## HIGH Fixes

### 4. Frontend `.env` tracked and `.gitignore` missing env patterns
- **Files**:
  - `FrancoSport-web/.gitignore` — Added `.env`, `.env.*`, `!.env.example` patterns.
  - `FrancoSport-web/.env` — Removed from git index via `git rm --cached`.

## WARNING (real) Fixes

### 5. Refresh token lifecycle weaknesses
- **File**: `FrancoSport-API/src/utils/jwt.js:24-27, 48-53`
- **Fix**: `generateRefreshToken` and `verifyRefreshToken` now fail-fast with a clear error if `JWT_REFRESH_SECRET` is not set. Removed fallback to `JWT_SECRET`.
- **Deferred**: Token rotation/revocation requires schema changes (server-side token storage). Documented below.

### 6. Admin product update lacks validation and whitelisting
- **Files**:
  - `FrancoSport-API/src/routes/admin/products.routes.js:47` — Added `express-validator` rules consistent with create route (all optional).
  - `FrancoSport-API/src/controllers/admin/products.controller.js:238-270` — Replaced `...req.body` spread with explicit field whitelist.

### 7. Weak hardcoded seed credentials
- **File**: `FrancoSport-API/prisma/seed.js:18-19, 329-332`
- **Fix**: Credentials now read from `SEED_ADMIN_PASSWORD` / `SEED_USER_PASSWORD` env vars. Dev fallbacks only outside production. Fails in production if not provided. Console output no longer shows actual passwords.

### 8. Duplicate `total_amount` in order creation
- **File**: `FrancoSport-API/src/controllers/order.controller.js:359`
- **Fix**: Removed duplicate `total_amount: total` property.

## WARNING Fixes

### 9. Multiple PrismaClient instances (singleton)
- **13 files fixed** — all `new PrismaClient()` in `src/` replaced with `import prisma from '../../utils/prisma.js'` (or `../utils/prisma.js` for non-admin controllers).
- Files: `admin/orders`, `admin/products`, `admin/users`, `admin/dashboard`, `admin/coupons`, `admin/promotions`, `admin/reviews`, `admin/shipping`, `admin/categories`, `admin/brands`, `wishlist`, `promotions`, `community`.

### 10. VAPID private key logging
- **File**: `FrancoSport-API/src/controllers/notification.controller.js:10-23`
- **Fix**: Production now throws if VAPID keys missing (fail-fast). Dev mode logs guidance to generate keys without exposing generated private key.

### 11. Low-stock query invalid Prisma cross-field comparison
- **File**: `FrancoSport-API/src/controllers/admin/products.controller.js:372-399`
- **Fix**: Replaced invalid `prisma.product.fields.low_stock_threshold` with raw SQL query for ID selection, then Prisma `findMany` for includes.

### 15. Expired seed coupons
- **File**: `FrancoSport-API/prisma/seed.js:301-325`
- **Fix**: Replaced hardcoded `2025-12-31` with dynamic `oneYearFromNow` calculation.

## Deferred / Documented

### 5 (partial). Refresh token rotation/revocation
- **Reason**: Requires schema changes (server-side token or version field on User). Safely mitigated by enforcing separate refresh secret. Full rotation requires a migration + new table/column.

### 12. Missing tests and CI
- **Reason**: Creating tests requires dependency setup and potentially large scope. Documented as pending.

### 13. Inconsistent error response formats
- **Reason**: Broad refactor across all controllers. Would exceed surgical fix scope.

### 14. Debug/dev artifacts committed
- **Reason**: Requires judgment on which scripts are useful. Noted for manual cleanup.
- **Specific debug log found**: `FrancoSport-API/src/controllers/admin/users.controller.js:171-172` has `console.log('DEBUG:...')` lines — should be removed in a cleanup pass.
