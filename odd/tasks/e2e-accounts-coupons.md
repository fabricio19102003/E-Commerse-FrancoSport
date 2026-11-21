# e2e-accounts-coupons
Walk the real flows of PRs #15 and #17 (accounts, coupons, free shipping, change password) on a local stack before merging them.
Branch feat/profile-password-free-shipping (top of the stack: PR #17 on PR #15).

## Specs
- S1 User request: "ok si metele con la union y las pruebas completas" — run the full end-to-end walkthrough (as done for PRs #7-#13), then merge #15 and #17.
- S2 Local stack as in odd/tasks/e2e-validation.md: throwaway MySQL, API via `npm start` with env vars from the process (never `.env` files), `prisma db push` + `prisma generate` + `npm run db:seed`, web production build on `vite preview`; Cloudinary storage simulated with a `node --import` double outside the repo; no SMTP: emails are logged as [MOCK EMAIL], and the walkthrough reads the verification/reset links from the API log.
- S3 Flows (Playwright, 1440 customer + admin, 390 customer): register → notice "Verifique su correo" → checkout blocked until verified (Spanish message) → resend → open the verification link → notice gone → order allowed; forgot password (known and unknown email: same screen) → open the reset link → new password works, old one fails, old session ends; a second forgot request kills the first link; change password from the profile → stays logged in, old password fails; admin creates PERCENTAGE, FIXED_AMOUNT and FREE_SHIPPING coupons in the panel (Bs. amounts, validation messages); customer applies each at checkout (discount shown = charged, coupon or points not both, minimum purchase message, used-up limit message), free shipping with two shipping methods; customer cancels an order with a coupon (use released), admin reopens (use taken again); admin changes a customer's email → verification required again. Screenshots per step.
- S4 Bugs: small ones fixed test-first inside the stack (API test or Playwright assertion), everything else reported. No business-rule changes.

## Tasks
- [x] T1 (S1-S4) Local stack + walkthrough + fixes — worker — commit f5f0073
- [ ] T2 (S1) Merge #15 then #17 (merge commits) — parent — commit: n/a

## Log
- L1 (user): "ok si metele con la union y las pruebas completas". Order chosen: walkthrough first, merge after green.
- L2: walkthrough green: A 20/20 (register, verify, forgot/reset, profile change), B 31/31 (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING plain and capped, min purchase, total and per-customer limits, coupon or points, cancel/reopen times_used), C 10/10 (390 + admin email change). 4 web bugs fixed (revoked session store, stale login/register toasts, admin field errors, checkout notice) + mock email links outside production. API 441 tests. Not exercised: payment proof upload, QR config. Reported: Home banner "ENVÍO GRATIS > BS. 500" not checked against the API; seed ships FRANCO20 and ENVIOGRATIS coupons.
