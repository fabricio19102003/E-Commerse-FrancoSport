# accounts-coupons
Step 4 of the review: password reset, email verification, coupons at checkout, Stripe removed.
Branch feat/accounts-coupons (from main after PRs #7, #9, #11, #13).

## Specs
- S1 User request: "ok si uni las prs y sigamos con el punto 4" — step 4: "recuperar contraseña, verificar el correo, aplicar los cupones en el checkout y decidir qué hacer con Stripe." Review findings: "No existe 'Olvidé mi contraseña' ni la verificación de correo. Como los correos de marketing solo van a clientes con correo verificado, no le llegan a casi nadie"; "Los cupones se cargan en el panel pero nunca se aplican al pagar"; Stripe dependency unused and Home says "Pago 100% seguro con Stripe".
- S2 Stripe, user chose "Sacar Stripe y el texto (Recomendado)": remove Stripe dependencies (web and API), env/config references (VITE_STRIPE_PUBLIC_KEY, STRIPE_*), README mentions and the Home claim; replace the claim with the real methods (QR, transferencia, contra entrega).
- S3 Email verification, user chose "Todo, con aviso; verificar para comprar (Recomendado)": a customer with an unverified email can log in and browse; sees a notice "Verifique su correo" with a resend button (rate-limited); a verification link (single-use, expiring token, stored hashed) marks email_verified; creating an order requires a verified email (API 403 with a Spanish message and the checkout shows the notice and resend); marketing emails keep going only to verified customers. Registration sends the verification email. Admin-created or seeded users keep their current flag.
- S4 Password reset: "¿Olvidó su contraseña?" on login → email with a single-use expiring link (token stored hashed, ~60 min) → reset page sets a new password (same password rules as registration) and invalidates the token and existing refresh sessions where possible; the request endpoint answers the same for existing and unknown emails (no enumeration) and is rate-limited; Spanish emails and pages.
- S5 Coupons, user chose "Cupón o puntos, no ambos": one coupon per order, entered in checkout and validated on the server (active, within starts_at/expires_at, minimum purchase on the subtotal, maximum discount, usage_limit_total vs times_used, usage_limit_per_user vs the customer's non-cancelled orders with that coupon, percentage or fixed per DiscountType); an order with a coupon cannot also redeem points (clear Spanish error) and the checkout lets the customer choose one; the discount is stored (coupon_id, discount_amount) and times_used increments atomically with the order; cancelling an order releases the use (times_used decremented once) and reopening takes it again or fails clearly if no longer valid; the checkout shows the coupon discount exactly as charged.
- S6 Emails go through the existing email service (nodemailer); without SMTP config they are logged as today ([MOCK EMAIL]); links use FRONTEND_URL. Tests never send real email.

## Tasks
- [ ] T1 (S1, S3, S4, S6) Email verification and password reset (API + web) — worker A — Risk: item 2 — commit: pending
- [ ] T2 (S1, S2, S5) Coupons at checkout and Stripe removal (API + web) — worker B — Risk: item 1 — commit: pending
- [ ] T3 (S3-S5) Independent verification — gentle-ai-verify — commit: n/a

## Log
- L1 (user): "ok si uni las prs y sigamos con el punto 4". PRs #7, #9, #11, #13 merged with merge commits.
- L2 (user answers): Stripe "Sacar Stripe y el texto (Recomendado)"; verification "Todo, con aviso; verificar para comprar (Recomendado)"; coupons "Cupón o puntos, no ambos".
- L3: Coupon model already has discount_type, discount_value, minimum_purchase_amount, maximum_discount_amount, usage_limit_total, usage_limit_per_user, times_used, starts_at, expires_at, is_active, orders → no schema change for coupons. User.email_verified exists; reset/verification tokens need storage (T1 owns prisma/schema.prisma).
