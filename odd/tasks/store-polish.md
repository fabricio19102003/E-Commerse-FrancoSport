# store-polish
Small issues found in the end-to-end walkthrough, plus API rate limits that fit a single-page app.
Branch fix/store-polish (from fix/web-build, PR #11). Fourth PR of the chain.

## Specs
- S1 User choices after the walkthrough: "Montos en Bs. en el panel", "Estados y métodos en castellano", "Tras pagar, ir al pedido", "Datos de ejemplo con métodos de pago"; rate limit: "Más alto + estricto donde importa (Recomendado)".
- S2 Money: every amount in the admin panel shows "Bs." with the same format the customer sees (one shared formatter; no "$" left in the web).
- S3 Spanish labels: order statuses (PENDING, PROCESSING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED…), payment statuses and payment methods (CASH_ON_DELIVERY, BANK_TRANSFER, QR_TRANSFER) are shown in Spanish everywhere in customer and admin pages (one shared map; API values unchanged).
- S4 After a successful checkout the customer lands on the new order's detail page (with the proof-upload notice if applicable), not the home page; the duplicated "Entrega en 3-5 días" in the checkout shipping options appears once.
- S5 Seed: `npm run db:seed` also creates the payment configuration for QR and bank transfer (placeholder QR image URL and bank data clearly marked as example), so a fresh store can take transfer orders.
- S6 Rate limits: global limit 600 requests per 15 minutes per IP; stricter limits on login/register/refresh (10 per 15 minutes per IP, plus per email where the route has one), on order creation and on payment-proof upload (existing per-user limit kept); `TRUST_PROXY` env var (unset = no proxy, e.g. `1` behind one reverse proxy) passed to Express `trust proxy` so limits see the real client IP; Spanish 429 messages; limits still skipped when NODE_ENV=test except in tests that assert them.

## Tasks
- [ ] T1 (S1-S6) Web polish, seed and rate limits, test-first where testable — worker — commit: pending

## Log
- L1 (user answers after the end-to-end walkthrough of 2026-11-21): the four polish items and "Más alto + estricto donde importa (Recomendado)".
