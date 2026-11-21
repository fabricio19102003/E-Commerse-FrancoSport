# web-build
Make the Franco Sport web build pass and update vulnerable dependencies.
Branch fix/web-build (from fix/payments-uploads). Step 3 of the review. Worktree /home/pedro/projects/elvis/franco-sport-web-build.

## Specs
- S1 User request: "ok dale entonces sigamos por donde me propones", accepting step 3: "hacer que la web compile y actualizar las dependencias vulnerables." Review: "La web no compila. npm run build frena en la verificación de tipos con 15 errores: 12 son variables sin usar y 3 son errores reales, por ejemplo en Modal.tsx:187 falta children"; "13 vulnerabilidades conocidas: 1 crítica, 8 altas y 4 moderadas"; lint "146 problemas".
- S2 `npm run build` (tsc -b && vite build) passes in FrancoSport-web with no TypeScript error; the 3 real errors are fixed by correcting the code (not by `any`, `@ts-ignore` or loosening tsconfig); unused symbols removed.
- S3 `npm audit --omit=dev` in FrancoSport-web reports 0 critical and 0 high; prefer patch/minor upgrades; any major upgrade is justified, tested by build + a browser smoke of the main pages, and listed. Same check for FrancoSport-API (`npm audit --omit=dev`, now that it has a lockfile): 0 critical/high, without breaking its 162 tests.
- S4 Lint: `npm run lint` in FrancoSport-web has no errors in files touched by this change; report the remaining count (the 146 baseline may stay for untouched files, but no rule may be disabled globally to hide them).
- S5 No behaviour change: the main pages (home, products, product detail, cart, checkout, login, admin dashboard/products/orders) render in a production build (`vite preview`) with no console errors, checked with Playwright against the built app (API not required: pages may show their empty/error states, but must not crash).

## Tasks
- [ ] T1 (S1-S5) Fix TS errors, upgrade vulnerable dependencies, smoke the build — worker — Risk: item 5 (dependencies) — commit: pending

## Log
- L1 (user): "ok dale entonces sigamos por donde me propones" (step 1 PR #7, step 2 fix/payments-uploads, step 3 this).
