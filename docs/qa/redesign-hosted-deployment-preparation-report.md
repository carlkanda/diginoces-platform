# Redesign Hosted Deployment Preparation Report

Date: 2026-06-21

Branch: `codex/redesign-platform-shell`
Status: local approval recorded; hosted deployment preparation in progress

## Approval

The local redesign direction was accepted in chat on 2026-06-21, and the user explicitly approved preparing the redesign for hosted deployment in a separate step.

## Packaging Decisions

- Kept `.vercel/` out of git because it contains local project-link metadata.
- Kept `.agents/` out of git because it is a local Codex skill installation, not application source.
- Kept `output/` out of git because it contains generated Playwright QA evidence screenshots and local browser artifacts.
- Kept the deployable design context, shadcn setup, Diginoces logo assets, app source changes, redesign QA docs, and redesign verification scripts in the branch.

## Local Verification

The following checks passed before hosted deployment packaging:

- `npm ci`
- `npm run redesign:check:approval`
- `npm run redesign:design-system-check`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
- `npm run env:check-public`
- `npm run secrets:scan`
- `git diff --check`

Notes:

- The first `npm ci` attempt failed because Windows held a file lock on the native `lightningcss` package through repo-scoped shadcn MCP helper processes. Those helper processes were stopped, then `npm ci` passed.
- `npm audit --omit=dev` reported `0` production vulnerabilities. The plain `npm ci` summary still reported dev-scope advisories.
- `git diff --check` exited successfully and reported only expected LF/CRLF conversion warnings.

## Hosted Verification Plan

1. Commit and push the redesign branch.
2. Create a GitHub pull request for review and Vercel preview generation.
3. Verify the Vercel-hosted preview loads the public home page, login page, protected platform redirect, and representative authenticated routes.
4. Promote or merge only after the hosted build is ready and visual checks pass.

## Security Notes

- No `.env`, `.env.local`, Supabase service-role key, database password, WhatsApp token, Google credential, private key, real guest data, or real client data is intentionally included in this branch.
- The deployment keeps existing Supabase/Vercel environment-variable handling unchanged; no new secrets or environment variables were added.
