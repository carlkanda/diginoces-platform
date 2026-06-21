# Redesign Hosted Deployment Preparation Report

Date: 2026-06-21

Branch: `codex/redesign-platform-shell`
Status: local approval recorded; hosted deployment PR prepared

## Approval

The local redesign direction was accepted in chat on 2026-06-21, and the user explicitly approved preparing the redesign for hosted deployment in a separate step.

## Pull Request

- PR: `#129` — `Redesign Platform Experience for Hosted Deployment`
- Branch: `codex/redesign-platform-shell`
- Vercel preview generation is handled by the GitHub/Vercel integration after each push.
- The hosted preview may require Vercel authentication; this branch does not add or change preview-bypass secrets.

## Packaging Decisions

- Kept `.vercel/` out of git because it contains local project-link metadata.
- Kept `.agents/` out of git because it is a local Codex skill installation, not application source.
- Kept `output/` out of git because it contains generated Playwright QA evidence screenshots and local browser artifacts.
- Kept the deployable design context, shadcn setup, Diginoces logo assets, app source changes, redesign QA docs, and redesign verification scripts in the branch.

## Local Verification

The following checks passed after the deployment-preparation packaging and CodeRabbit review fixes:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
- `npm run env:check-public`
- `npm run redesign:check:approval`
- `npm run redesign:design-system-check`
- `npm run secrets:scan`
- `git diff --check`

Notes:

- The first `npm ci` attempt failed because Windows held a file lock on the native `lightningcss` package through repo-scoped shadcn MCP helper processes. Those helper processes were stopped, then `npm ci` passed.
- A second `npm ci` passed after review fixes pinned the TypeScript type packages and updated `package-lock.json`.
- `npm audit --omit=dev` reported `0` production vulnerabilities. The plain `npm ci` summary still reported dev-scope advisories.
- `git diff --check` exited successfully and reported only expected LF/CRLF conversion warnings.

## Review Follow-Up

Hosted CodeRabbit requested changes on the initial PR. The follow-up patch addressed the actionable findings by:

- pinning `@types/node`, `@types/react`, and `@types/react-dom` instead of using `latest`;
- adding a stylelint configuration for Tailwind v4 at-rules;
- removing the cyclic Tailwind `--font-sans` theme alias;
- extracting duplicated audit, invitation, and seating formatting helpers;
- correcting role-restricted dashboard tone;
- fixing check-in table display numbering;
- hiding downstream event dashboard and file handoff links when the viewer lacks the required permission;
- displaying zero-byte files as `0 B`;
- adding semantic list roles to the seating map markers;
- improving partner submission waiting-state copy so actionable reviews are not labeled as waiting.

## Hosted Verification Plan

1. Commit and push the redesign branch.
2. Create a GitHub pull request for review and Vercel preview generation.
3. Verify the Vercel-hosted preview loads the public home page, login page, protected platform redirect, and representative authenticated routes.
4. Promote or merge only after the hosted build is ready and visual checks pass.

## Security Notes

- No `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google credential, private key, real guest data, or real client data is intentionally included in this branch.
- The deployment keeps existing Supabase/Vercel environment-variable handling unchanged; no new secrets or environment variables were added.
