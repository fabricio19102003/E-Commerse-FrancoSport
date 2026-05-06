# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual `SKILL.md` files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Creating a pull request, opening a PR, or preparing changes for review. | branch-pr | `C:\Users\pedro.melgar\.config\opencode\skills\branch-pr\SKILL.md` |
| When writing guides, READMEs, RFCs, onboarding docs, architecture docs, or review-facing documentation. | cognitive-doc-design | `C:\Users\pedro.melgar\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| When drafting or posting feedback, review comments, maintainer replies, Slack messages, or GitHub comments. | comment-writer | `C:\Users\pedro.melgar\.config\opencode\skills\comment-writer\SKILL.md` |
| When a PR would exceed 400 changed lines, when planning chained PRs, stacked PRs, or reviewable slices. | gentle-ai-chained-pr | `C:\Users\pedro.melgar\.config\opencode\skills\chained-pr\SKILL.md` |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | `C:\Users\pedro.melgar\.config\opencode\skills\go-testing\SKILL.md` |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | `C:\Users\pedro.melgar\.config\opencode\skills\issue-creation\SKILL.md` |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | `C:\Users\pedro.melgar\.config\opencode\skills\judgment-day\SKILL.md` |
| Create/compile/convert LaTeX/PDF documents, slides, reports, exams, charts, OCR, PDF operations, or document format conversion. | latex-document | `C:\Users\pedro.melgar\.config\opencode\skills\latex-document\SKILL.md` |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | `C:\Users\pedro.melgar\.config\opencode\skills\skill-creator\SKILL.md` |
| When implementing a change, preparing commits, splitting PRs, or planning chained or stacked PRs. | work-unit-commits | `C:\Users\pedro.melgar\.config\opencode\skills\work-unit-commits\SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue; blank PRs without issue linkage are blocked.
- Verify the linked issue has `status:approved` before opening a PR.
- Branch names must match `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)/[a-z0-9._-]+$`.
- Every PR must have exactly one `type:*` label matching its type.
- PR body must include linked issue, one PR type, summary, changes table, test plan, and contributor checklist.
- Commit messages must be Conventional Commits: `type(scope): description` with allowed lowercase types.
- Do not add `Co-Authored-By` trailers.
- Run required checks for touched scripts, especially `shellcheck` for shell changes.

### cognitive-doc-design
- Lead with the answer: decision, action, or outcome first; context after.
- Use progressive disclosure: happy path first, then details, edge cases, and references.
- Chunk related information into short sections; avoid long flat lists.
- Use headings, labels, callouts, summaries, tables, checklists, examples, and templates.
- Optimize docs for review empathy: reviewers should verify intent without reconstructing the whole story.
- For PR/review docs, state what to review first and what is intentionally out of scope.
- Link previous and next PR when work is chained.
- Keep each section focused on one decision or work unit.

### comment-writer
- Start with the actionable point; do not recap the whole PR before feedback.
- Be warm and direct, like a thoughtful teammate, not a corporate bot.
- Prefer 1 to 3 short paragraphs or a tight bullet list.
- Explain the technical reason when asking for a change.
- Avoid pile-ons: comment on the highest-value issue, not every preference.
- Match the thread language; in Spanish use natural Rioplatense voseo.
- Do not use em dashes; use commas, periods, or parentheses instead.
- Formula: direct observation/request, why it matters if needed, concrete next action.

### gentle-ai-chained-pr
- MUST split PRs above 400 changed lines unless a maintainer approved `size:exception`.
- Design each PR for roughly 60 minutes or less of human review.
- One deliverable work unit per PR; do not mix unrelated refactors, features, tests, or docs.
- Every chained PR must state start, end, previous PRs, next PRs, dependencies, and out-of-scope work.
- Each slice must be autonomous, verifiable, CI-green, and reasonably rollbackable.
- Once a chain strategy is chosen, keep it consistent for the whole chain.
- Feature Branch Chain: child PRs target the tracker/feature branch, never `main`.
- Stacked PRs: later PRs target the previous PR branch until earlier PRs merge.
- Include a dependency diagram and status table in every chained PR.
- Use `size:exception` only for unavoidable large diffs with maintainer agreement.

### go-testing
- Prefer table-driven tests for multiple cases, with `name`, input, expected output, and `wantErr`.
- Test pure functions directly; mock dependencies for side effects.
- For Bubbletea, test model state transitions via `Model.Update()` first.
- Use `teatest.NewTestModel()` for full TUI integration flows.
- Use golden files for stable visual/output snapshots.
- Test success and error cases explicitly, especially returned errors.
- For command/system tests, use interfaces/mocks; real commands belong in integration tests and should skip in `testing.Short()`.
- For file operations, use `t.TempDir()` instead of shared paths.

### issue-creation
- Blank issues are disabled; always use a bug report or feature request template.
- Every new issue gets `status:needs-review`; maintainer must add `status:approved` before PR work.
- Search existing issues for duplicates before creating a new one.
- Questions belong in Discussions, not issues.
- Fill all required template fields and pre-flight checkboxes.
- Bug reports need description, reproduction steps, expected/actual behavior, OS, agent/client, and shell.
- Feature requests need problem, proposed solution, affected area, and alternatives/context when useful.
- PRs must wait for maintainer approval on the issue.

### judgment-day
- Resolve skills before launching judges: Engram `skill-registry`, then `.atl/skill-registry.md`, then no registry.
- Match compact rules by target code context and task context; inject identical Project Standards into both judges and fix agent.
- Launch exactly two independent blind judge agents in parallel with the same target and criteria.
- Judges classify findings as CRITICAL, WARNING (real), WARNING (theoretical), or SUGGESTION.
- Theoretical warnings are reported as INFO, do not block, do not trigger fixes or re-judgment.
- Synthesize results as confirmed, suspect A, suspect B, or contradiction; do not let judges see each other.
- Round 1 requires user approval before fixing confirmed issues.
- After fixes, re-judge with both judges; after two fix iterations, ask the user before continuing.
- Approved means zero confirmed CRITICALs and zero confirmed real WARNINGs.
- Every judge result must include `Skill Resolution: injected|fallback-registry|fallback-path|none`.

### latex-document
- Determine document type first; use the right template or write from scratch.
- For posters, use the poster sub-workflow and ask for conference/orientation/layout/color before writing.
- For cheat sheets/reference cards/formula sheets, use the cheat sheet sub-workflow and choose the right template.
- Ask about enrichment elements only when relevant or unspecified: images, charts, diagrams, citations, tables, watermarks.
- For 5+ page docs, avoid bullet-heavy output, escape `<` and `>` in text mode, vary section formats, limit `\newpage`, and size images around 0.75-0.85 textwidth.
- Compile through the provided compile script with auto engine detection; use XeLaTeX for CJK/RTL/fontspec cases.
- Use latexmk for complex documents with bibliographies, indexes, glossaries, or cross-references.
- For PDF conversion, split pages to images, choose a conversion profile, validate, concatenate, and compile.
- Scaling: 1-10 pages single agent, 11-20 split in half, 21+ batch-7 pipeline.
- For fillable PDFs, inspect fields first; for non-fillable PDFs, use images and validated annotation boxes.

### skill-creator
- Create a skill only for reusable AI guidance, project-specific conventions, complex workflows, or useful decision trees.
- Do not create a skill for trivial, one-off, or already documented patterns; link references instead.
- Required structure: `skills/{skill-name}/SKILL.md`, optional `assets/` for templates/schemas, optional `references/` for local docs.
- `SKILL.md` frontmatter must include lowercase hyphenated `name`, `description` with Trigger, `license`, author, and version.
- Start with critical patterns; use tables for decision trees; keep examples minimal.
- Do not add keyword sections, lengthy explanations, troubleshooting dumps, or web URLs in references.
- Skill names should be generic technology, project-component, project-test-component, or action-target.
- Register new skills in `AGENTS.md` after creation.

### work-unit-commits
- A commit represents one deliverable behavior, fix, migration, or docs unit.
- Do not commit by file type if the intermediate commits do not work alone.
- Keep tests in the same commit as the behavior they verify.
- Keep docs with the user-visible change or workflow they explain.
- Each commit should tell a reviewable story and be a candidate chained PR if scope grows.
- Before committing, confirm one clear purpose, coherent repo state, included verification/docs, and reasonable rollback.
- If SDD forecasts a 400-line risk, group commits into chained PR slices before implementation.
- For high risk, follow the chosen delivery strategy: ask-on-risk, auto-chain, or approved `size:exception`.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| None found | N/A | No `AGENTS.md`, `agents.md`, `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`, or `.cursorrules` found at repository root. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
