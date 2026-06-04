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
import { copyFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = fileURLToPath(new URL("../", import.meta.url));
export const defaultBacklogAliases = [
  ["traceability_matrix.csv", "traceability-matrix.csv"],
  ["module_coverage.csv", "module-coverage.csv"],
];

const defaultFileSystem = {
  copyFileSync,
  existsSync,
  statSync,
};

export function syncBacklogAliases({
  aliases = defaultBacklogAliases,
  fileSystem = defaultFileSystem,
  logger = console,
  repoRoot = defaultRepoRoot,
} = {}) {
  const backlogDir = join(repoRoot, "docs", "backlog");
  let synced = 0;
  let failed = 0;

  if (
    !fileSystem.existsSync(backlogDir) ||
    !fileSystem.statSync(backlogDir).isDirectory()
  ) {
    logger.error(
      `Backlog directory not found: ${backlogDir}. Ensure docs/backlog exists.`,
    );

    return { failed: 1, synced: 0 };
  }

  if (!aliases || aliases.length === 0) {
    logger.warn?.("No backlog aliases configured; nothing to sync.");
    logger.log("Backlog alias sync summary: 0 synced, 0 failed.");

    return { failed: 0, synced: 0 };
  }

  for (const [canonical, alias] of aliases) {
    const canonicalPath = join(backlogDir, canonical);
    const aliasPath = join(backlogDir, alias);

    if (!fileSystem.existsSync(canonicalPath)) {
      logger.error(
        `Canonical backlog file missing: ${canonical} in ${backlogDir}. Export it before syncing ${alias}.`,
      );
      failed += 1;
      continue;
    }

    try {
      fileSystem.copyFileSync(canonicalPath, aliasPath);
      logger.log(`Synced ${alias} from ${canonical} in ${backlogDir}`);
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error(
        `Failed to sync ${alias} from ${canonical} in ${backlogDir}: ${message}`,
      );
      failed += 1;
    }
  }

  logger.log(`Backlog alias sync summary: ${synced} synced, ${failed} failed.`);

  return { failed, synced };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = syncBacklogAliases();

  if (result.failed > 0) {
    process.exitCode = 1;
  }
}
