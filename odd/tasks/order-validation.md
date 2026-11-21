# order-validation
Secure order creation in the Franco Sport API: validated items, owned address, real shipping method and server-side cost, validated loyalty points refunded on cancellation.
Branch fix/order-validation (from main). First tests of the API (none existed).

## Specs
- S1 User request: "ok si metele pa con lo de los pedidos", accepting step 1 of the review: "Arreglar los pedidos: validar cantidades y direcciones, calcular el envío en el servidor y validar los puntos."
- S2 Items (review finding: "un cliente puede pedir -5 unidades. Eso le baja el total del pedido y además le suma stock al producto. Tampoco se controlan cantidades en cero o con decimales."): `items` is a non-empty array (max 50 lines); each `quantity` is an integer from 1 to 99; `product_id` and optional `variant_id` are positive integers that exist, are active, and the variant belongs to that product; the same product/variant twice is merged or rejected consistently; stock is checked and decremented atomically (no oversell under concurrent orders); prices come only from the database (a variant without its own price uses the product price, never 0).
- S3 Address (review: "un pedido se puede asignar a la dirección de envío de otro cliente"): `shipping_address_id` must belong to the authenticated user; otherwise the same 4xx as a missing address (no existence leak).
- S4 Shipping (review: "no se verifica que el método de envío exista" and "El envío siempre cuesta 0"): `shipping_method_id` must exist, be active and belong to an active zone; `shipping_cost` is computed on the server from the method (base_cost plus cost_per_kg × total weight when products have a weight; otherwise base_cost); the client never sends the amount; the web checkout uses a real method (not the hardcoded id 1) and shows the cost returned/computed consistently.
- S5 Loyalty points (review: "el canje no se valida, y al cancelar un pedido no se devuelven"): `redeem_points` optional integer ≥ 0, not more than the user's balance; only the points actually used are deducted (never more than the order total allows); cancelling an order (customer cancel and admin status change to CANCELLED) returns the redeemed points exactly once and restores stock exactly once.
- S6 Every rule above is enforced in the API with clear Spanish error messages in the existing error format; existing successful flows (create order with valid data, cancel, admin approve) keep working; no schema change unless strictly needed (then a documented `prisma db push`-compatible change).

## Tasks
- [ ] T1 (S1-S6) Test setup (Vitest + supertest + throwaway MySQL) and the order fixes, test-first — worker — Risk: items 1 and 2 — commit: pending
- [ ] T2 (S2-S5) Independent verification — gentle-ai-verify — commit: n/a

## Log
- L1 (user, after the review of 2026-11-21): "ok si metele pa con lo de los pedidos".
- L2: review findings (Engram franco-sport/initial-review): order.routes.js validates only that items is an array; order.controller.js createOrder (stock check `stock < quantity`, subtotal, shipping hardcoded 0 at ~304, redeem_points unvalidated); web Checkout.tsx:168 sends shipping_method_id 1; API has no tests, no lockfile (package-lock.json is gitignored) and no CI.
