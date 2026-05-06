# Judgment Day Franco Sport Tasks

## Checklist

- [x] Generate `.atl/skill-registry.md` from available global skills.
- [x] Create OpenSpec proposal and task artifacts for the audit.
- [x] Run Judgment Day round 1 with two independent blind judges.
- [x] Synthesize judge findings into confirmed, suspect, and contradiction groups.
- [x] **Await user approval before fixes** — user approved all confirmed issues.
- [x] Apply approved fixes — see `fixes-round-1.md` for details.
  - [x] Fix 1: Payment proof IDOR (ownership check)
  - [x] Fix 2: Cloudinary delete admin-only
  - [x] Fix 3: Transactional order cancellation (user + admin)
  - [x] Fix 4: .env gitignore + untrack
  - [x] Fix 5: JWT_REFRESH_SECRET fail-fast
  - [x] Fix 6: Product update validation + whitelist
  - [x] Fix 7: Seed credentials from env vars
  - [x] Fix 8: Duplicate total_amount removed
  - [x] Fix 9: PrismaClient singleton (13 files)
  - [x] Fix 10: VAPID key logging replaced with fail-fast
  - [x] Fix 11: Low-stock raw query fix
  - [x] Fix 15: Dynamic seed coupon dates
- [x] Re-run both judges after Round 1 fixes (Round 2 judgment).
- [x] Apply Round 2 confirmed fixes — see `fixes-round-2.md` for details.
  - [x] Fix R2-1: Disallow CANCELLED in updateOrderStatus (force /cancel route)
  - [x] Fix R2-2: Remove debug console.log PII leak + add role validation on PUT route + field whitelist
  - [x] Fix R2-3: Fix low-stock raw query PostgreSQL→MySQL regression
- [x] Final blind re-review — both judges CLEAN, zero CRITICAL, zero real WARNING.
- [x] **Judgment Day: APPROVED** ✅ — see `final-verdict.md` for full details.

## Deferred Non-Blocking Items

- [ ] `.env` git history audit/cleanup (if real secrets existed)
- [ ] Refresh token rotation/revocation (requires schema migration)
- [ ] Tests and CI setup
- [ ] Consistent error response format refactor
- [ ] Debug/dev artifact cleanup
- [ ] Optional `globalThis` Prisma guard for hot-reload
- [ ] Decimal precision review

## Review Workload Forecast

- 400-line budget risk: Moderate — 13 files changed, ~350 lines delta
- Chained PRs recommended: No — changes are cohesive security/correctness fixes
- Decision needed before apply: No
- Chain strategy: N/A — single coherent fix batch
