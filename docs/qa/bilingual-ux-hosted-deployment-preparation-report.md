# Bilingual UX Hosted Deployment Preparation Report

Date: 2026-06-21

Branch: `codex/bilingual-ux-simplification-homepage`

Status: hosted preview ready for product-owner review

## Traceability

- Requirement ID: `UX-REDESIGN-001`
- Backlog reference: `docs/backlog/master-requirements-register.csv` row `UX-REDESIGN-001`; this is an out-of-band redesign and hosted-review preparation pass approved by the product owner, not Sprint 16 AI Assistance implementation.
- GitHub issue: `#131` - Bilingual UX simplification and public home refinement
- Source design documents: `PRODUCT.md`, `DESIGN.md`
- Redesign checklist: `docs/qa/redesign-rebuild-checklist.md`
- Active governance context: `AGENTS.md` currently lists Sprint 16 and `docs/planning/sprint-16-plan.md`; this branch is out-of-band redesign hardening and hosted-prep work, not Sprint 16 AI Assistance implementation.

## Scope

This branch prepares the approved local redesign for hosted review with an additional bilingual and simplification pass.

Included:

- French-first application language support with an English switcher.
- A new public home page direction designed for prospects, customers, and non-technical visitors.
- Reduced information density on core workspace pages by moving secondary guidance into hover help.
- A static-copy localization foundation for existing product screens.
- Local verification, CodeRabbit review, PR review, and Vercel preview deployment.

Not included:

- database schema changes;
- Supabase RLS or permission changes;
- product workflow changes;
- production promotion before hosted preview approval.

## Design And UX Decisions

- French is the default language because Diginoces operations are primarily French-facing.
- English remains available through a global language switcher on public, auth, and workspace surfaces.
- Public home uses a separate brand-facing design philosophy: image-led, simple, and emotionally attractive, while the authenticated app remains a calm operational workspace.
- Dense helper paragraphs on operational pages are reduced or moved behind information icons so non-technical users can focus on the next safe action.
- Existing workflows, links, server actions, form fields, and permission-gated pages remain unchanged.

## Deployment Path

1. Keep work on this feature branch.
2. Run the full local quality gate.
3. Run local CodeRabbit review from WSL.
4. Commit and push the branch.
5. Open a pull request against `main`.
6. Use the GitHub/Vercel integration to create the hosted preview.
7. Verify the hosted preview before merging or promoting anything to production.

## Verification Log

The Impeccable detector check is the local design-quality detector command
`node .agents\skills\impeccable\scripts\detect.mjs --json ...`. It scans the
touched UI, i18n, and QA files for blocked Impeccable design patterns and
returns a JSON list of findings; `[]` means no detector findings were reported.

| Check | Result | Notes |
| --- | --- | --- |
| Local browser review | Passed | Chrome verified localized public home, language radio controls, Arrow-key focus movement without language commit, Space commit to English with `lang="en-US"`, localized public nav label, hero image presence, login page language controls, and `/platform` redirect to `/login?next=%2Fplatform`. |
| `npm ci` | Passed | First attempt hit a Windows file-lock `EPERM` on `lightningcss`; retry completed with 789 packages installed. |
| `npm run format:check` | Passed | Prettier check passed after review fixes. |
| `npm run lint` | Passed | ESLint passed. |
| `npm run typecheck` | Passed | Next route type generation and TypeScript checks passed for web and database workspaces. |
| `npm run test` | Passed | Vitest passed: 27 files, 299 tests. |
| `npm run build` | Passed | Next.js production build completed with `next build --webpack`. |
| `npm audit --omit=dev` | Passed | 0 production vulnerabilities. |
| Supabase RLS & schema verification | Not applicable | This branch intentionally has no database schema, RLS, permission, or migration changes. |
| `npm run redesign:check:approval` | Passed | 47 route rows, 47 browser verified, 0 blocked. |
| `npm run redesign:design-system-check` | Passed | No blocked design-system patterns found. |
| `npm run redesign:check` | Passed | 47 route rows, 47 browser verified, 0 blocked. |
| Impeccable detector | Passed | Detector returned `[]` for the design context, touched app files, i18n files, and QA docs. |
| `npm run env:check-public` | Passed | Public environment variable check passed. |
| `npm run secrets:scan` | Passed | Targeted secret scan passed. |
| `git diff --check` | Passed with warnings | Exit code 0; Windows reported LF-to-CRLF warnings only. |
| Local CodeRabbit | Passed | WSL CodeRabbit CLI review loop completed; actionable findings were fixed before push. A pre-push branch-existence finding was a false positive because the branch did not exist remotely yet. |
| GitHub CI | Passed | PR `#132` `Verify` workflow passed. |
| Vercel preview | Passed | PR `#132` Vercel deployment completed successfully. |
| Hosted browser smoke check | Passed | Chrome loaded the protected Vercel preview home page and confirmed the Diginoces title, default French hero copy, and language controls. Further scripted interaction was blocked by an open Chrome extension UI, so deeper hosted interaction remains a product-owner visual review item. |
| Hosted CodeRabbit | Informational | CodeRabbit status is green, but the hosted review was skipped because PR `#132` is still a draft. Mark the PR ready when the hosted visual review is approved to trigger the normal hosted CodeRabbit review. |

## Hosted Review Notes

- Vercel project link: local `.vercel/project.json` points to the existing `diginoces-platform` project.
- No new environment variables are introduced by this branch.
- Pull request: `https://github.com/carlkanda/diginoces-platform/pull/132`
- Vercel preview URL: `https://diginoces-platform-git-codex-bilingu-3e8239-carlkandas-projects.vercel.app`
- Vercel deployment dashboard: use the latest `Vercel` status check on PR `#132`; deployment IDs change on each pushed commit, while the branch preview URL remains stable.
- Production deployment should wait for hosted preview visual approval, PR readiness, hosted CodeRabbit review, and merge approval.

## Security Notes

- No `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google credential, private key, raw public guest token, real guest data, or real couple/client data should be included.
- The generated home image is a generic event-operations scene and contains no client data, QR code, or real invitation content.
- Language switching, permission checks, and data filtering must remain enforced by server-side code and existing backend/RLS boundaries, not only by hidden or translated frontend controls.
- Build artifacts, unintended source maps, local output files, and preview-only URLs must not be committed or leaked from this hosted-prep branch.
