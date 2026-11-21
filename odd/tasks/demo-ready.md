# demo-ready
Remove the free-shipping promises and make Franco Sport easy to start locally to show it to the owner.
Branch chore/demo-ready (from main).

## Specs
- S1 User request: "ok lo del envio gratis a partir de 500bs quitalo. tambien quiero que luego revises que existan usuario admin en el seed, como se levanta el proyecto y demas para poder mostrarle al propietario de franco sport". Demo location chosen: "En mi máquina (local)".
- S2 No page promises free shipping the store does not apply (top bar "Envío Gratis > Bs. 500" with its countdown, Home "Envío gratis en compras superiores a Bs. 500", product detail "Envío gratis > Bs. 1000").
- S3 Seed: a fresh database gets, with one command, an active ADMIN user and a verified demo CUSTOMER (emails documented, passwords from SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD or a documented local fallback that never applies in production), categories, brands, products with images, stock and weights, shipping zone and methods, the example payment configuration, and the example coupons; re-running the seed does not fail or duplicate data (idempotent) and never resets passwords already changed.
- S4 One-command local start for the demo on Linux (the user's machine; Windows `.ps1` scripts may stay): MySQL in Docker, API and web, without the user having to create `.env` files by hand (the start script passes the variables through the environment or generates local ones it never commits), plus a stop command; data persists between runs unless a reset command is used. Ports that do not clash with the user's other projects (the barbershop uses 8000/54320; check what is free).
- S5 A Spanish guide `DEMO.md` at the repo root for showing the store to the owner: requirements, start/stop/reset commands, URLs, demo accounts, a 10-minute tour (customer: register, verify via the logged link, browse, cart, coupon, checkout with QR proof; admin: dashboard, orders, approve payment, products, coupons, reports PDF) and known limits (no SMTP: links in the API log; Cloudinary needed for real image uploads — say what happens without it).

## Tasks
- [x] T1 (S2) Remove free-shipping promises — parent — commit 90bd1f5
- [ ] T2 (S3-S5) Seed review, one-command local start, DEMO.md, verified by a real start from scratch — worker — commit: pending

## Log
- L1 (user): "ok lo del envio gratis a partir de 500bs quitalo. tambien quiero que luego revises que existan usuario admin en el seed, como se levanta el proyecto y demas para poder mostrarle al propietario de franco sport".
- L2 (user): demo "En mi máquina (local)".
- L3 (user, on images for the demo): "Guardado local solo para desarrollo (Recomendado)" → a local storage driver for development only: images saved under a local folder and served by the API; enabling it with NODE_ENV=production makes the API refuse to start; tests for both. Needs src/app.js (static route) — parent widens the worker surface.
