#!/usr/bin/env node
/**
 * @file Synchronizes hyphenated backlog CSV aliases from canonical
 * underscore-named exports.
 *
 * @requirement ROAD-001, TECH-010
 * @backlog EPIC-RELEASE, FEAT-REL-001
 * @sprint Sprint 15 - Release Hardening, QA & MVP Launch
 * @github GitHub issue #31
 *
 * @usage node scripts/sync-backlog-aliases.mjs
 *
 * Keeps active-agent docs linked to the backlog and requirement register by
 * preserving compatibility aliases for exported traceability CSV snapshots.
 *
 * Run after refreshing canonical backlog exports and before release-readiness
 * verification. The script resolves repoRoot, backlogDir, and the aliases array
 * below, then copies each canonical CSV to its compatibility alias. The
 * release-readiness test guards that aliases remain content-compatible.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  defaultBacklogAliases,
  defaultFileSystem,
  defaultRepoRoot,
  syncBacklogAliases,
} = require("./sync-backlog-aliases-core.cjs");

export {
  defaultBacklogAliases,
  defaultFileSystem,
  defaultRepoRoot,
  syncBacklogAliases,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = syncBacklogAliases();

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}
