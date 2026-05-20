# Database Package

This package will contain database-related shared logic, schema notes, generated types, migration helpers, and database validation utilities.

## Sprint 1 focus

- Keep schema decisions traceable to `docs/technical-design/database-schema-core-entities.md`.
- Store actual migrations under `supabase/migrations/`.
- Do not add production credentials or secrets.

## Current foundation

Sprint 1 adds a package placeholder for database metadata and validation helpers. The first migration is:

```text
supabase/migrations/20260520153012_sprint_1_foundation.sql
```

The migration covers only user, role, permission, audit-log, and file registry foundations.
