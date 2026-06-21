# Local Redesign Post-Approval Runbook

Date: 2026-06-21

Branch: `codex/bilingual-ux-simplification-homepage`
Status: Local approval recorded. Hosted deployment preparation is approved; use this runbook before deployment.

## Purpose

Use this runbook after local review is accepted in `docs/qa/local-redesign-user-acceptance-checklist.md`. It keeps deployment gated on recorded approval, clean verification, PR review, and hosted verification rather than an accidental direct update.

## Preconditions

- Review the route families in `docs/qa/local-redesign-user-acceptance-checklist.md`.
- Use `docs/qa/local-redesign-route-review-pack.md` as the route-family review path.
- Use `docs/qa/local-redesign-review-session-guide.md` for concrete local URLs and safe linked-dev record IDs.
- Record any requested changes in the acceptance checklist and `docs/qa/redesign-rebuild-checklist.md` before editing source.
- Check both final approval boxes in the acceptance checklist.
- Replace the `Pending user approval.` final approval note with the approval note and date.
- Run `npm run redesign:check:approval` and confirm it passes.

## Required Command Order

Run these commands after final local approval is recorded:

1. `npm run redesign:check`
2. `npm run redesign:check:approval`
3. `npm run redesign:design-system-check`
4. `npm run format:check`
5. `npm run lint`
6. `npm run typecheck`
7. `npm run test`
8. `npm run build`
9. `node .agents/skills/impeccable/scripts/detect.mjs --json PRODUCT.md DESIGN.md scripts/check-redesign-readiness.mjs scripts/check-redesign-design-system.mjs docs/qa/local-redesign-qa-evidence.md docs/qa/local-redesign-readiness-audit.md docs/qa/local-redesign-review-handoff.md docs/qa/local-redesign-route-review-pack.md docs/qa/local-redesign-review-session-guide.md docs/qa/local-redesign-user-acceptance-checklist.md docs/qa/local-redesign-post-approval-runbook.md docs/qa/local-redesign-completion-audit.md docs/qa/redesign-rebuild-checklist.md`
10. `git diff --check`

## Deployment Rule

Do not deploy from this branch until the user acceptance checklist is checked and `npm run redesign:check:approval` passes.

Hosted deployment preparation has been separately approved by the user. Production promotion may proceed only after the branch is committed, pushed, reviewed, built successfully on Vercel, and visually verified on the hosted deployment.

## If Feedback Requires Changes

- Record the route family, route, and design issue in `docs/qa/local-redesign-user-acceptance-checklist.md`.
- Add the implementation note and verification result to `docs/qa/redesign-rebuild-checklist.md`.
- Re-run `npm run redesign:check` after source or QA documentation changes.
- Re-run the full command order above only after the feedback is resolved and final approval is recorded again.
