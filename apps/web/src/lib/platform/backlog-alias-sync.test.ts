/**
 * @file Test suite for backlog alias synchronization.
 *
 * @requirement ROAD-001, TECH-010
 * @backlog EPIC-RELEASE, FEAT-REL-001
 * @sprint Sprint 15 - Release Hardening, QA & MVP Launch
 * @github GitHub issue #31
 */
import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = process.env.REPO_ROOT?.trim() || findRepoRoot(here);

function findRepoRoot(start: string) {
  let current = start;

  while (true) {
    if (
      existsSync(join(current, "package.json")) &&
      existsSync(join(current, "scripts", "sync-backlog-aliases.mjs")) &&
      existsSync(join(current, "docs", "backlog"))
    ) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      throw new Error(`Could not find repository root from ${start}.`);
    }

    current = parent;
  }
}

type SyncBacklogAliases = (options: {
  aliases: [string, string][];
  fileSystem: {
    copyFileSync: (source: string, target: string) => void;
    existsSync: (path: string) => boolean;
    statSync: (path: string) => { isDirectory: () => boolean };
  };
  logger: {
    error: (message: string) => void;
    log: (message: string) => void;
    warn?: (message: string) => void;
  };
  repoRoot: string;
}) => { failed: number; synced: number };

async function loadSyncBacklogAliases() {
  const scriptUrl = pathToFileURL(
    join(repoRoot, "scripts", "sync-backlog-aliases.mjs"),
  ).href;
  const syncModule = await import(/* @vite-ignore */ scriptUrl);

  return syncModule.syncBacklogAliases as SyncBacklogAliases;
}

function createLogger() {
  return {
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  };
}

function pathEndsWithBacklogDirectory(testPath: string) {
  const segments = normalize(testPath).split(/[\\/]+/);

  return segments.slice(-2).join("/") === "docs/backlog";
}

describe("syncBacklogAliases", () => {
  it("copies canonical backlog exports to aliases and reports success", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();
    const copyFileSync = vi.fn();

    const result = syncBacklogAliases({
      aliases: [["traceability_matrix.csv", "traceability-matrix.csv"]],
      fileSystem: {
        copyFileSync,
        existsSync: () => true,
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 0, synced: 1 });
    expect(copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining("traceability_matrix.csv"),
      expect.stringContaining("traceability-matrix.csv"),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "Synced traceability-matrix.csv from traceability_matrix.csv",
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Backlog alias sync summary: 1 synced, 0 failed.",
    );
  });

  it("reports a missing canonical backlog export", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();
    const copyFileSync = vi.fn();

    const result = syncBacklogAliases({
      aliases: [["traceability_matrix.csv", "traceability-matrix.csv"]],
      fileSystem: {
        copyFileSync,
        existsSync: (path) => !path.endsWith("traceability_matrix.csv"),
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 1, synced: 0 });
    expect(copyFileSync).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "Canonical backlog file missing: traceability_matrix.csv",
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Backlog alias sync summary: 0 synced, 1 failed.",
    );
  });

  it("reports a missing backlog directory before syncing aliases", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();

    const result = syncBacklogAliases({
      aliases: [["traceability_matrix.csv", "traceability-matrix.csv"]],
      fileSystem: {
        copyFileSync: vi.fn(),
        existsSync: (path) => !pathEndsWithBacklogDirectory(path),
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 1, synced: 0 });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Backlog directory not found"),
    );
  });

  it("warns when no aliases are configured", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();

    const result = syncBacklogAliases({
      aliases: [],
      fileSystem: {
        copyFileSync: vi.fn(),
        existsSync: () => true,
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 0, synced: 0 });
    expect(logger.warn).toHaveBeenCalledWith(
      "No backlog aliases configured; nothing to sync.",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Backlog alias sync summary: 0 synced, 0 failed.",
    );
  });

  it("reports copy failures without aborting the summary", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();

    const result = syncBacklogAliases({
      aliases: [["module_coverage.csv", "module-coverage.csv"]],
      fileSystem: {
        copyFileSync: () => {
          throw new Error("disk denied");
        },
        existsSync: () => true,
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 1, synced: 0 });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "Failed to sync module-coverage.csv from module_coverage.csv",
      ),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("disk denied"),
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Backlog alias sync summary: 0 synced, 1 failed.",
    );
  });

  it("reports malformed alias entries without aborting valid syncs", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();
    const copyFileSync = vi.fn();

    const result = syncBacklogAliases({
      aliases: [
        ["traceability_matrix.csv", "traceability-matrix.csv"],
        ["missing-target.csv"] as unknown as [string, string],
        "invalid-entry" as unknown as [string, string],
      ],
      fileSystem: {
        copyFileSync,
        existsSync: () => true,
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 2, synced: 1 });
    expect(copyFileSync).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Invalid backlog alias entry"),
    );
    expect(logger.log).toHaveBeenCalledWith(
      "Backlog alias sync summary: 1 synced, 2 failed.",
    );
  });

  it("rejects alias entries that escape the backlog directory", async () => {
    const syncBacklogAliases = await loadSyncBacklogAliases();
    const logger = createLogger();
    const copyFileSync = vi.fn();

    const result = syncBacklogAliases({
      aliases: [
        ["../traceability_matrix.csv", "traceability-matrix.csv"],
        ["module_coverage.csv", "nested/module-coverage.csv"],
      ],
      fileSystem: {
        copyFileSync,
        existsSync: () => true,
        statSync: () => ({ isDirectory: () => true }),
      },
      logger,
      repoRoot: "repo",
    });

    expect(result).toEqual({ failed: 2, synced: 0 });
    expect(copyFileSync).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Unsafe backlog alias entry"),
    );
  });
});
