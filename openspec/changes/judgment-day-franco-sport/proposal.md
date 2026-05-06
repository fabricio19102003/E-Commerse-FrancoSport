# Judgment Day Franco Sport

## Intent

Prepare an adversarial, full-project Judgment Day audit for Franco Sport to identify issues that should be resolved later. This change is discovery-only: it establishes the review artifacts and skill context, but does not implement fixes yet.

## Scope

In scope:
- Build and persist the project skill registry used by the later judges.
- Create OpenSpec file-based artifacts for the audit workflow.
- Use hybrid persistence: Engram for durable cross-session memory plus OpenSpec files for repository-local traceability.
- Plan round 1 blind judges, synthesis, user approval, fixes, and re-judge cycles.

Out of scope:
- Applying code fixes before the first Judgment Day verdict.
- Opening commits, pushes, or pull requests.
- Running builds.

## Persistence Decision

This audit uses **hybrid persistence**:
- Engram stores reusable context and decisions under project `franco-sport`.
- OpenSpec stores file-based change artifacts under `openspec/changes/judgment-day-franco-sport/`.

## Success Criteria

- `.atl/skill-registry.md` exists in the temporary repository clone.
- OpenSpec `proposal.md` and `tasks.md` exist for `judgment-day-franco-sport`.
- Engram contains the full skill registry under `topic_key: skill-registry`.
- Engram contains the hybrid OpenSpec audit decision under `topic_key: openspec/judgment-day-franco-sport`.
- No code fixes, builds, commits, pushes, or PRs are performed during this preparation step.
