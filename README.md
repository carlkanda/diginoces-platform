# Diginoces Platform

This repository contains the source code, technical documentation, and AI-agent build control system for the Diginoces wedding guest-management platform.

## Repository purpose

Diginoces is being transformed from a Google tools + Python scripts workflow into a professional responsive web application for wedding guest management, invitations, RSVP, WhatsApp-first communication, check-in, table planning, print exports, guest wishes, reports, and partner operations.

## Documentation structure

```text
docs/
  product/
  agent-system/
  backlog/
  technical-design/
  planning/
  setup/
```

## Build rule

No feature should be implemented unless it is linked to a documented requirement ID, and no requirement should be marked complete unless it has been implemented, tested, and reviewed.

## Sprint 1 foundation

The Sprint 1 web foundation lives in `apps/web` and is wired through npm workspaces.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Local setup details are maintained in `docs/setup/local-development.md`.
