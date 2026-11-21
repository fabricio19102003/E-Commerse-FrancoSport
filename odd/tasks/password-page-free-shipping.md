# password-page-free-shipping
Two small follow-ups of PR #15: a "Cambiar contraseña" page for customers and free-shipping coupons.
Branch feat/profile-password-free-shipping (from feat/accounts-coupons, PR #15).

## Specs
- S1 User request: "ok lo de los env lo hare despues, hagamos los pendientes chicos excepto lo del ci de github" — the small items: "la pantalla 'Cambiar contraseña' en el perfil (la API ya está lista)" and "los cupones de envío gratis".
- S2 Cambiar contraseña: a section or tab in the customer's profile with current password, new password and confirmation (same rules as registration, shown before submitting), show/hide toggles, Spanish errors from the API (wrong current password, weak password), success message; uses the existing `PUT /api/users/password` and `users.service.changePassword` (which stores the fresh token pair, so the customer stays logged in); keyboard and screen-reader accessible; 44 px targets on phones.
- S3 Free-shipping coupons: `FREE_SHIPPING` coupons are accepted at checkout (they are rejected today) and in the admin coupon screen. They set the order's shipping cost discount to the full shipping cost (capped by `maximum_discount_amount` when set), never touch product prices, follow every other coupon rule (dates, minimum purchase on the subtotal, total and per-customer limits, coupon or points not both, cancel releases the use, reopen re-validates), and the stored `discount_amount` and totals are exact. The preview endpoint returns the shipping discount for the chosen shipping method (pass `shipping_method_id`); the checkout shows "Envío gratis" (or the capped amount) as charged. `discount_value` is not required for FREE_SHIPPING in the admin form.

## Tasks
- [x] T1 (S1, S2) Change password page — worker — commit c3ec1f2
- [x] T2 (S1, S3) Free-shipping coupons (API + checkout + admin) — worker — Risk: item 1 — commit 61ddecd

## Log
- L1 (user): "ok lo de los env lo hare despues, hagamos los pendientes chicos excepto lo del ci de github".
- L2: T1 Playwright (mocked API) 1440/390 OK; parent fixed the focused error field hidden under the sticky header on phones. T2 RED 22 failed → GREEN; API 437 tests twice; web tsc 0, build OK; checkout/admin not exercised in a browser. The API only requires 8 characters for passwords (the form follows it).
