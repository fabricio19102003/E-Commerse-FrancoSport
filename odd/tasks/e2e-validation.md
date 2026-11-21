# e2e-validation
Run the whole Franco Sport store locally and walk the real flows in a browser before merging PRs #7, #9 and #11.
Branch fix/web-build (top of the stack: PR #11).

## Specs
- S1 User request: "ok quiero primero resolver lo de franco sport asi que metele a eso", accepting step 1: "Probar todo de punta a punta y unir los PR: levantar la tienda completa en tu máquina (API, MySQL y web) y recorrer con Playwright el flujo real: registro, carrito, checkout con un método de envío, subir el comprobante, el admin aprueba el pago, cancelar y reabrir. También probaría el formulario de productos y el PDF."
- S2 Local stack: MySQL 8.4 in a throwaway Docker container, API (`npm start`) with env vars passed through the process environment (never by reading or writing `.env` files), `prisma db push` + `npm run db:seed`, web served from a production build (`vite preview`) pointing at the API. Seeded shipping methods, products with stock and an admin.
- S3 Cloudinary: without real credentials, image storage is simulated locally; any simulation must be explicit, impossible to enable in production, and reported as "simulated" in the results.
- S4 Playwright flows at 1440 and 390 (customer) and 1440 (admin), asserting what the user sees: register a customer; browse and add two products; checkout with a real shipping method and QR/transfer payment (cost shown = cost charged); upload the proof (or from the order detail); admin sees the order, the proof, approves the payment; a second order: customer cancels while pending (stock back), customer cannot cancel a paid order (message shown); admin cancels and reopens; admin creates/edits a product with the zod 4 form (validation messages in Spanish, save works); admin exports a PDF report (jspdf 4) and the file is a valid PDF. Screenshots of each step.
- S5 Every bug found is reported with reproduction; fixed test-first when small and inside the stack's scope (API test or Playwright assertion), otherwise listed for the user. No change of business rules.

## Tasks
- [ ] T1 (S1-S5) Local stack + Playwright walkthrough + fixes — worker — commit: pending

## Log
- L1 (user): "ok quiero primero resolver lo de franco sport asi que metele a eso".
