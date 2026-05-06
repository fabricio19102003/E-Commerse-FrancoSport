# Judgment Day — Round 2 Fixes Applied

## WARNING Fixes (confirmed by both judges)

### 1. Admin `updateOrderStatus` allows CANCELLED without stock restoration

- **Files**:
  - `FrancoSport-API/src/routes/admin/orders.routes.js:30-32` — Removed `CANCELLED` from allowed statuses in validation; added guidance message pointing to `/cancel`.
  - `FrancoSport-API/src/controllers/admin/orders.controller.js:232` — Removed dead `CANCELLED` branch from status handler since validation now blocks it.
- **Rationale**: Dedicated `/cancel` endpoint (`cancelOrder`) already exists with transactional stock restoration (fixed in Round 1). Disallowing `CANCELLED` in the generic status-update route is the smallest correct fix — forces admins through the proper cancel flow.

### 2. Admin user update leaks request body and lacks role validation

- **Files**:
  - `FrancoSport-API/src/controllers/admin/users.controller.js:167-176` — Removed two `console.log('DEBUG:...')` lines that leaked PII. Replaced destructuring with explicit field whitelist (same pattern as product controller from Round 1).
  - `FrancoSport-API/src/routes/admin/users.routes.js:30-40` — Added `express-validator` rule for optional `role` field with enum `['ADMIN', 'CUSTOMER', 'MODERATOR']` on the PUT route.
- **Note**: The dedicated `PATCH /:id/role` endpoint already had role validation. This fix ensures the generic PUT endpoint also validates.

### 3. Low-stock raw query uses PostgreSQL-style quoting (regression from Round 1)

- **File**: `FrancoSport-API/src/controllers/admin/products.controller.js:388-394`
- **Fix**: Changed `"Product"` (PostgreSQL double-quoted identifier) to `products` (actual MySQL mapped table name from `@@map("products")` in schema). MySQL does not require quoting for simple identifiers; column names `stock`, `low_stock_threshold`, `is_active` match schema exactly.

## Deferred

- `.env` git history: `.env` is now untracked (staged deletion from Round 1) and `.gitignore` updated. History rewriting (BFG/filter-branch) is deferred as it requires coordination with all contributors and is destructive. Documented for team awareness.
- Refresh token rotation: Still deferred (requires schema migration).
- Tests/CI, error format consistency, debug artifact cleanup: Still deferred from Round 1.
