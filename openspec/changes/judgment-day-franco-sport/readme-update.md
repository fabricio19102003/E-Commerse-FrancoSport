# README Update — Post Judgment Day

**Date:** 2026-05-06  
**Scope:** Root `README.md` rewritten following cognitive-doc-design principles.

## What Changed

The root README was a 2-line placeholder. It now covers:

1. Project overview with current audit status
2. Quick start path (API + Web)
3. Repository structure table
4. Prerequisites
5. Environment setup with all `.env.example` variables documented
6. Scripts from both `package.json` files
7. Architecture summary (API + Web + integrations)
8. Security notes from all audit fixes
9. Testing/CI status (not yet implemented — honest)
10. Deferred work checklist from the audit
11. Review checklist for evaluators
12. Audit artifact index

## Design Decisions

- Used cognitive-doc-design patterns: lead with the answer, progressive disclosure, tables over prose, review empathy.
- Documented `JWT_REFRESH_SECRET` as required (fail-fast) since this was a critical audit finding.
- Listed deferred items as unchecked tasks so they're trackable.
- Did NOT invent test commands or CI config — stated honestly that tests don't exist yet.
- Referenced Engram for persistent audit context.
