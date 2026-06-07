/**
 * @file Sprint 15 release readiness validation suite.
 *
 * @requirement TECH-010, ROAD-001
 * @backlog EPIC-RELEASE, FEAT-REL-002, FEAT-REL-003, FEAT-REL-004
 * @sprint Sprint 15 - Release Hardening, QA & MVP Launch
 * @github GitHub issue #31
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import {
  sanitizeTesterId,
  validateArtifactFilename,
} from "@/lib/platform/qa-artifact-filenames";

const here = fileURLToPath(new URL(".", import.meta.url));
// REPO_ROOT can be set in CI or non-standard runners; use an absolute repo path.
const repoRoot = process.env.REPO_ROOT?.trim() || findRepoRoot(here);
const migrationDir = join(repoRoot, "supabase", "migrations");

function findRepoRoot(start: string) {
  let current = start;

  while (true) {
    if (
      existsSync(join(current, "package.json")) &&
      existsSync(join(current, "supabase", "migrations"))
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

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function expectRepoFileExists(path: string) {
  expect(existsSync(join(repoRoot, path)), `${path} exists`).toBe(true);
}

function parseQaScenarioTableIds(markdown: string) {
  return [...markdown.matchAll(/^\|\s*(QA-\d{3})\s*\|/gm)]
    .map((match) => match[1]!)
    .sort();
}

function readMarkdownSection(
  markdown: string,
  startHeading: string,
  endHeading?: string,
) {
  const startIndex = markdown.indexOf(startHeading);

  if (startIndex < 0) {
    throw new Error(`Missing markdown section: ${startHeading}`);
  }

  const nextHeadingIndex = endHeading
    ? markdown.indexOf(endHeading, startIndex + startHeading.length)
    : markdown.indexOf("\n## ", startIndex + 1);

  return nextHeadingIndex < 0
    ? markdown.slice(startIndex)
    : markdown.slice(startIndex, nextHeadingIndex);
}

function readMigrationBySuffix(suffix: string) {
  const matches = readdirSync(migrationDir).filter((entry) =>
    entry.endsWith(suffix),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one migration ending with ${suffix}, found ${matches.length}.`,
    );
  }

  const migrationFile = matches[0]!;

  return readFileSync(join(migrationDir, migrationFile), "utf8");
}

type MigrationFile = {
  content: string;
  name: string;
};

function readMigrationHistory() {
  return readdirSync(migrationDir)
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => ({
      content: readFileSync(join(migrationDir, entry), "utf8"),
      name: entry,
    }));
}

type FunctionPrivilegeStatement = {
  signature: string;
  roles: string[];
};

type FunctionPrivilegeOperation = "grant" | "revoke";

type OrderedFunctionPrivilegeStatement = FunctionPrivilegeStatement & {
  operation: FunctionPrivilegeOperation;
};

function normalizeRoleList(roles: string) {
  return roles
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function roleSetsMatch(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((role, index) => role === right[index])
  );
}

function normalizeSqlStatement(statement: string) {
  return statement
    .replaceAll("\r", " ")
    .replaceAll("\n", " ")
    .trim()
    .split(/\s+/)
    .join(" ");
}

function normalizeFunctionSignature(signature: string) {
  return signature
    .toLowerCase()
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

type SqlSpan = {
  kind: "code" | "comment" | "quoted";
  text: string;
};

function scanSqlSpans(sql: string) {
  const normalizedSql = sql.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const spans: SqlSpan[] = [];
  let code = "";

  const pushCode = () => {
    if (code) {
      spans.push({ kind: "code", text: code });
      code = "";
    }
  };

  for (let index = 0; index < normalizedSql.length; index += 1) {
    const character = normalizedSql[index];
    const nextCharacter = normalizedSql[index + 1];

    if (character === "-" && nextCharacter === "-") {
      const commentSpan = readSqlLineCommentSpan(normalizedSql, index);

      pushCode();
      spans.push({ kind: "comment", text: commentSpan.text });
      index = commentSpan.end;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      const commentSpan = readSqlBlockCommentSpan(normalizedSql, index);

      pushCode();
      spans.push({ kind: "comment", text: commentSpan.text });
      index = commentSpan.end;
      continue;
    }

    if (character === "'" || character === '"' || character === "$") {
      const quotedSpan = readQuotedSqlSpan(normalizedSql, index);

      if (quotedSpan) {
        pushCode();
        spans.push({ kind: "quoted", text: quotedSpan.text });
        index = quotedSpan.end;
        continue;
      }
    }

    code += character;
  }

  pushCode();

  return spans;
}

function readDollarQuoteTag(sql: string, start: number) {
  const end = sql.indexOf("$", start + 1);

  if (end < 0) {
    return null;
  }

  const tagBody = sql.slice(start + 1, end);
  const hasValidTag = tagBody === "" || /^\p{L}[\p{L}\p{N}_]*$/u.test(tagBody);

  return hasValidTag ? sql.slice(start, end + 1) : null;
}

function readSqlLineCommentSpan(sql: string, start: number) {
  let end = start;

  while (end < sql.length && sql[end] !== "\n") {
    end += 1;
  }

  if (end < sql.length) {
    end += 1;
  }

  return { end: end - 1, text: sql.slice(start, end) };
}

function readSqlBlockCommentSpan(sql: string, start: number) {
  const end = sql.indexOf("*/", start + 2);

  if (end < 0) {
    return { end: sql.length - 1, text: sql.slice(start) };
  }

  const textEnd = end + 2;

  return { end: textEnd - 1, text: sql.slice(start, textEnd) };
}

function isPostgresEscapedString(sql: string, start: number) {
  if (start < 1) {
    return false;
  }

  const marker = sql[start - 1];
  const hasIdentifierBeforeMarker =
    start >= 2 && /[A-Za-z0-9_$]/.test(sql[start - 2]!);

  return (marker === "E" || marker === "e") && !hasIdentifierBeforeMarker;
}

function readQuotedSqlSpan(sql: string, start: number) {
  const delimiter = sql[start];

  if (!delimiter) {
    return null;
  }

  if (delimiter === "$") {
    const tag = readDollarQuoteTag(sql, start);

    if (!tag) {
      return null;
    }

    const end = sql.indexOf(tag, start + tag.length);

    if (end < 0) {
      return { end: sql.length - 1, text: sql.slice(start) };
    }

    const textEnd = end + tag.length;

    return { end: textEnd - 1, text: sql.slice(start, textEnd) };
  }

  if (delimiter !== "'" && delimiter !== '"') {
    return null;
  }

  const allowsBackslashEscapes =
    delimiter === "'" && isPostgresEscapedString(sql, start);

  for (let index = start + 1; index < sql.length; index += 1) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (allowsBackslashEscapes && character === "\\" && nextCharacter) {
      index += 1;
      continue;
    }

    if (character === delimiter) {
      if (nextCharacter === delimiter) {
        index += 1;
        continue;
      }

      return { end: index, text: sql.slice(start, index + 1) };
    }
  }

  return { end: sql.length - 1, text: sql.slice(start) };
}

function splitSqlStatements(sql: string) {
  const statements: string[] = [];
  let current = "";

  for (const span of scanSqlSpans(sql)) {
    if (span.kind === "comment") {
      current += " ";
      continue;
    }

    if (span.kind === "quoted") {
      current += span.text;
      continue;
    }

    for (const character of span.text) {
      if (character === ";") {
        statements.push(current);
        current = "";
        continue;
      }

      current += character;
    }
  }

  if (current.trim()) {
    statements.push(current);
  }

  return statements;
}

function findBalancedSignatureEnd(sql: string, start: number) {
  let depth = 0;

  for (let index = start; index < sql.length; index += 1) {
    const character = sql[index];

    if (character === "(") {
      depth += 1;
      continue;
    }

    if (character === ")") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function parseFunctionPrivilegeStatement(
  statement: string,
  operation: FunctionPrivilegeOperation,
): FunctionPrivilegeStatement | null {
  const prefix = `${operation} execute on function `;
  const roleSeparator = operation === "grant" ? " to " : " from ";
  const sql = normalizeSqlStatement(statement);
  const lowerSql = sql.toLowerCase();

  if (!lowerSql.startsWith(prefix)) {
    return null;
  }

  const signatureEndIndex = findBalancedSignatureEnd(lowerSql, prefix.length);

  if (signatureEndIndex < 0) {
    return null;
  }

  const roleIndex = signatureEndIndex + 1;

  if (!lowerSql.startsWith(roleSeparator, roleIndex)) {
    return null;
  }

  const roleListCandidate = sql.slice(roleIndex + roleSeparator.length).trim();
  const roleList = roleListCandidate.endsWith(";")
    ? roleListCandidate.slice(0, -1).trim()
    : roleListCandidate;

  if (
    roleList.includes(";") ||
    !/^[a-z_][a-z0-9_]*(\s*,\s*[a-z_][a-z0-9_]*)*$/i.test(roleList)
  ) {
    return null;
  }

  return {
    signature: sql.slice(prefix.length, signatureEndIndex + 1).trim(),
    roles: normalizeRoleList(roleList),
  };
}

function parseOrderedFunctionPrivilegeStatement(
  statement: string,
): OrderedFunctionPrivilegeStatement | null {
  const grant = parseFunctionPrivilegeStatement(statement, "grant");

  if (grant) {
    return { ...grant, operation: "grant" };
  }

  const revoke = parseFunctionPrivilegeStatement(statement, "revoke");

  return revoke ? { ...revoke, operation: "revoke" } : null;
}

function parseFunctionPrivilegeStatements(
  migration: string,
  operation: FunctionPrivilegeOperation,
): FunctionPrivilegeStatement[] {
  return splitSqlStatements(migration)
    .map((statement) => parseFunctionPrivilegeStatement(statement, operation))
    .filter((statement): statement is FunctionPrivilegeStatement =>
      Boolean(statement),
    );
}

function parseFunctionGrants(migration: string, roles: string) {
  const requiredRoles = normalizeRoleList(roles);

  return parseFunctionPrivilegeStatements(migration, "grant")
    .filter((statement) => roleSetsMatch(statement.roles, requiredRoles))
    .map((statement) => statement.signature);
}

function parseFunctionRevokes(migration: string, role = "public") {
  const normalizedRole = role.toLowerCase();

  return parseFunctionPrivilegeStatements(migration, "revoke")
    .filter((statement) => statement.roles.includes(normalizedRole))
    .map((statement) => statement.signature);
}

// Single-migration check: this only catches explicit GRANT ... TO anon in the
// Sprint 15 migration text itself.
function hasAnonGrantStatementForSignature(content: string, signature: string) {
  const normalizedSignature = normalizeFunctionSignature(signature);

  return parseFunctionPrivilegeStatements(content, "grant").some(
    (statement) =>
      normalizeFunctionSignature(statement.signature) === normalizedSignature &&
      statement.roles.includes("anon"),
  );
}

// Full-history check: walk grant/revoke statements in chronological and textual
// order so later reverts/grants are applied. It models explicit anon/PUBLIC
// statements only; default PUBLIC execute is guarded because Sprint 15 must emit
// explicit REVOKE FROM public statements for authenticated-only RPCs. A function
// that only relies on default PUBLIC execute and is never explicitly revoked
// would not be marked public here; revokeSignatureSet coverage below is the
// required assumption that keeps this structural test valid.
type EffectiveFunctionPrivilegeState = {
  anonState: boolean;
  authenticatedState: boolean;
  publicState: boolean;
  serviceRoleState: boolean;
};

function buildEffectiveFunctionPrivilegeStates(migrations: MigrationFile[]) {
  const states = new Map<string, EffectiveFunctionPrivilegeState>();

  for (const migration of migrations) {
    for (const rawStatement of splitSqlStatements(migration.content)) {
      const statement = parseOrderedFunctionPrivilegeStatement(rawStatement);

      if (!statement) {
        continue;
      }

      const normalizedSignature = normalizeFunctionSignature(
        statement.signature,
      );
      const state = states.get(normalizedSignature) ?? {
        anonState: false,
        authenticatedState: false,
        publicState: false,
        serviceRoleState: false,
      };

      if (statement.roles.includes("anon")) {
        state.anonState = statement.operation === "grant";
      }

      if (statement.roles.includes("authenticated")) {
        state.authenticatedState = statement.operation === "grant";
      }

      if (statement.roles.includes("public")) {
        state.publicState = statement.operation === "grant";
      }

      if (statement.roles.includes("service_role")) {
        state.serviceRoleState = statement.operation === "grant";
      }

      states.set(normalizedSignature, state);
    }
  }

  return states;
}

function hasEffectiveAnonGrantForSignature(
  states: Map<string, EffectiveFunctionPrivilegeState>,
  signature: string,
) {
  const state = states.get(normalizeFunctionSignature(signature));

  return Boolean(state?.anonState || state?.publicState);
}

function hasEffectiveFunctionGrantForRole(
  states: Map<string, EffectiveFunctionPrivilegeState>,
  signature: string,
  role: "anon" | "authenticated" | "public" | "service_role",
) {
  const state = states.get(normalizeFunctionSignature(signature));

  if (!state) {
    return false;
  }

  if (role === "anon") {
    return state.anonState;
  }

  if (role === "authenticated") {
    return state.authenticatedState;
  }

  if (role === "service_role") {
    return state.serviceRoleState;
  }

  return state.publicState;
}

function parseCanonicalLaunchClassificationCounts() {
  const coverage = readRepoFile("docs/planning/mvp-requirements-coverage.md");
  const match = coverage.match(
    /Canonical launch classification counts:\s*`launch_blocker=(\d+)`,\s*`launch_risk=(\d+)`,\s*`acceptable_mvp_risk=(\d+)`,\s*`post_launch_follow_up=(\d+)`/,
  );

  if (!match) {
    throw new Error(
      "Missing canonical launch classification counts in mvp-requirements-coverage.md.",
    );
  }

  return {
    acceptable_mvp_risk: Number(match[3]),
    launch_blocker: Number(match[1]),
    launch_risk: Number(match[2]),
    post_launch_follow_up: Number(match[4]),
  };
}

function parseCompletionReportLaunchClassificationCounts() {
  const report = readRepoFile("docs/planning/sprint-15-completion-report.md");
  const expectedKeys = [
    "acceptable_mvp_risk",
    "launch_blocker",
    "launch_risk",
    "post_launch_follow_up",
  ] as const;
  const counts = new Map<string, number>();
  const occurrences = new Map<string, number>();

  if (!/^\s*\|\s*Classification\s*\|\s*Count\s*\|\s*[^|]+\|/m.test(report)) {
    throw new Error(
      "Missing launch classification count table header in sprint-15-completion-report.md.",
    );
  }

  // Expected table rows use: | `classification_key` | numeric_count | ...
  for (const match of report.matchAll(
    /^\s*\|\s*`([^`]+)`\s*\|\s*(\d+)\s*\|/gm,
  )) {
    const key = match[1];

    counts.set(key, Number(match[2]));
    occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
  }

  const missingKeys = expectedKeys.filter((key) => !counts.has(key));
  const duplicatedKeys = [...occurrences.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  if (missingKeys.length > 0 || duplicatedKeys.length > 0) {
    throw new Error(
      [
        missingKeys.length > 0
          ? `missing classification rows: ${missingKeys.join(", ")}`
          : "",
        duplicatedKeys.length > 0
          ? `duplicated classification rows: ${duplicatedKeys.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; "),
    );
  }

  const getCount = (key: (typeof expectedKeys)[number]) => {
    const count = counts.get(key);

    if (typeof count !== "number") {
      throw new Error(`missing classification row: ${key}`);
    }

    return count;
  };

  return {
    acceptable_mvp_risk: getCount("acceptable_mvp_risk"),
    launch_blocker: getCount("launch_blocker"),
    launch_risk: getCount("launch_risk"),
    post_launch_follow_up: getCount("post_launch_follow_up"),
  };
}

describe("Sprint 15 release readiness", () => {
  it("keeps required Sprint 15 release evidence documents in the repo", () => {
    for (const path of [
      "docs/planning/mvp-requirements-coverage.md",
      "docs/setup/deployment-readiness.md",
      "docs/planning/mvp-known-limitations.md",
      "docs/planning/mvp-release-notes.md",
      "docs/planning/mvp-rollback-plan.md",
      "docs/planning/mvp-launch-checklist.md",
      "docs/planning/sprint-15-completion-report.md",
      "docs/architecture/file-management-policy.md",
      "docs/setup/qa-artifact-store.md",
      "docs/setup/security-risk-acceptance-template.md",
      "docs/qa/mvp-manual-qa-scenarios.md",
      "docs/qa/mvp-qa-evidence-ledger.md",
      "docs/qa/mvp-ui-qa-setup.md",
      "docs/qa/security-review.md",
      "docs/qa/permissions-review.md",
      "docs/qa/rls-review.md",
      "docs/qa/post-launch-monitoring.md",
    ]) {
      expect(existsSync(join(repoRoot, path)), `${path} exists`).toBe(true);
    }
  });

  it("validates QA artifact filenames with parser-safe tester and scenario metadata", () => {
    expect(
      validateArtifactFilename(
        "20260603T123000Z__tester=qa_tester=west__scenario=QA-001.png",
      ),
    ).toEqual({
      error: null,
      parsed: {
        extension: "png",
        scenario: "QA-001",
        tester: "qa_tester=west",
        timestamp: "20260603T123000Z",
      },
      valid: true,
    });
    expect(
      validateArtifactFilename(
        "20260603T123000Z__tester=qa_west__scenario=QA-025__artifact=checksum=pre.sha256",
      ).parsed,
    ).toMatchObject({
      artifact: "checksum=pre",
      extension: "sha256",
      scenario: "QA-025",
      tester: "qa_west",
    });
    expect(
      validateArtifactFilename(
        "20260603T123000Z__tester=qa__west__scenario=QA-001.png",
      ),
    ).toMatchObject({
      error: "missing key/value",
      valid: false,
    });
    expect(
      validateArtifactFilename("20260603T123000Z__tester=qa_west.png"),
    ).toMatchObject({
      error: "missing segments",
      valid: false,
    });
    expect(
      validateArtifactFilename(
        "20260603T123000Z__tester=qa_west__artifact=log.txt",
      ),
    ).toMatchObject({
      error: "missing required keys",
      valid: false,
    });
    expect(sanitizeTesterId(" QA  tester__west ")).toBe("QA_tester_west");
  });

  it("keeps the MVP QA evidence ledger aligned with all manual QA scenarios", () => {
    const manualScenarios = readRepoFile("docs/qa/mvp-manual-qa-scenarios.md");
    const evidenceLedger = readRepoFile("docs/qa/mvp-qa-evidence-ledger.md");
    const manualCoreScenarios = readMarkdownSection(
      manualScenarios,
      "## Core Scenarios",
      "\n## QA-025 Rollback Rehearsal Evidence",
    );
    const manualNegativeScenarios = readMarkdownSection(
      manualScenarios,
      "## Negative Permission Checks",
      "\n### Required Negative-Case Assertions",
    );
    const expectedScenarioIds = Array.from(
      { length: 36 },
      (_, index) => `QA-${String(index + 1).padStart(3, "0")}`,
    );
    const ledgerScenarioIds = parseQaScenarioTableIds(evidenceLedger);

    expect(
      parseQaScenarioTableIds(
        `${manualCoreScenarios}\n${manualNegativeScenarios}`,
      ),
    ).toEqual(expectedScenarioIds);
    expect(ledgerScenarioIds).toEqual(expectedScenarioIds);
    expect(
      (
        evidenceLedger.match(
          /^\|\s*QA-\d{3}\s*\|[^\n]*\|\s*`pending_external_artifact`\s*\|/gm,
        ) ?? []
      ).length,
    ).toBe(36);
    expect(evidenceLedger).not.toMatch(/https?:\/\//i);
    expect(evidenceLedger).toContain(
      "Production decision from this ledger: `no_go`",
    );
  });

  it("allows the loopback host used by local browser QA in Next dev mode", () => {
    expect(nextConfig.allowedDevOrigins).toContain("127.0.0.1");
  });

  it("keeps Sprint 15 launch classification counts aligned with the canonical coverage ledger", () => {
    expect(parseCompletionReportLaunchClassificationCounts()).toEqual(
      parseCanonicalLaunchClassificationCounts(),
    );
  });

  it("keeps Sprint 15 backlog path aliases available for active-agent docs", () => {
    for (const path of [
      "docs/backlog/traceability-matrix.csv",
      "docs/backlog/traceability_matrix.csv",
      "docs/backlog/module-coverage.csv",
      "docs/backlog/module_coverage.csv",
    ]) {
      expectRepoFileExists(path);
    }

    expect(readRepoFile("docs/backlog/traceability-matrix.csv")).toBe(
      readRepoFile("docs/backlog/traceability_matrix.csv"),
    );
    expect(readRepoFile("docs/backlog/module-coverage.csv")).toBe(
      readRepoFile("docs/backlog/module_coverage.csv"),
    );
  });

  it("documents that TD-001 remains open after the Sprint 15 stable recheck", () => {
    const technicalDebt = readRepoFile("docs/planning/technical-debt.md");
    const td001Section =
      technicalDebt.match(/## TD-001[\s\S]*?(?=\n## |\n# |$)/)?.[0] ?? "";

    expect(td001Section).toContain("TD-001");
    expect(td001Section).toMatch(/\bopen\b/i);
    expect(td001Section).toMatch(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December) (0?[1-9]|[12]\d|3[01]), (19|20)\d{2}\b/,
    );
  });

  // Authenticated RPCs are derived from the migration grant block to avoid
  // duplicating the long allowlist in test code. The public guest RPC allowlist
  // remains intentionally explicit because these are the only anon RPC grants.
  // This is structural migration validation; docs/qa/rls-review.md contains
  // the post-apply runtime privilege query for the linked Supabase project.
  it("narrows default SECURITY DEFINER RPC grants while preserving token-scoped public flows", () => {
    const migration = readMigrationBySuffix(
      "_sprint_15_release_security_grants.sql",
    );
    const migrationHistory = readMigrationHistory();
    const effectiveFunctionPrivilegeStates =
      buildEffectiveFunctionPrivilegeStates(migrationHistory);
    const authenticatedRpcSignatures = parseFunctionGrants(
      migration,
      "authenticated, service_role",
    );
    const actualPublicTokenRpcSignatures = parseFunctionGrants(
      migration,
      "anon, authenticated, service_role",
    );
    const authenticatedGrantSignatureSet = new Set(
      authenticatedRpcSignatures.map(normalizeFunctionSignature),
    );
    const publicTokenGrantSignatureSet = new Set(
      actualPublicTokenRpcSignatures.map(normalizeFunctionSignature),
    );
    const grantSignatures = new Set([
      ...authenticatedGrantSignatureSet,
      ...publicTokenGrantSignatureSet,
    ]);
    const revokeSignatures = parseFunctionRevokes(migration);
    const revokeSignatureSet = new Set(
      revokeSignatures.map(normalizeFunctionSignature),
    );
    const anonRevokeSignatureSet = new Set(
      parseFunctionRevokes(migration, "anon").map(normalizeFunctionSignature),
    );
    expect(authenticatedRpcSignatures.length).toBeGreaterThan(0);
    expect(new Set(authenticatedRpcSignatures).size).toBe(
      authenticatedRpcSignatures.length,
    );
    expect(revokeSignatureSet.size).toBe(revokeSignatures.length);
    expect(revokeSignatureSet.size).toBe(grantSignatures.size);
    for (const signature of revokeSignatureSet) {
      expect(grantSignatures.has(signature)).toBe(true);
    }
    const publicTokenRpcSignatures = [
      "public.list_guest_file_downloads(text)",
      "public.resolve_guest_file_download(text, uuid)",
      "public.resolve_guest_public_page(text)",
      "public.submit_public_guest_message(text, text, text, uuid)",
      "public.submit_public_rsvp(text, uuid, public.rsvp_status, text)",
    ];
    const publicTokenSignatureSet = new Set(
      publicTokenRpcSignatures.map(normalizeFunctionSignature),
    );
    expect([...publicTokenGrantSignatureSet].sort()).toEqual(
      [...publicTokenSignatureSet].sort(),
    );

    expect(normalizeSqlStatement(migration).toLowerCase()).toContain(
      normalizeSqlStatement(
        "alter default privileges for role postgres in schema public revoke execute on functions from public;",
      ).toLowerCase(),
    );

    for (const signature of authenticatedRpcSignatures) {
      const normalizedSignature = normalizeFunctionSignature(signature);

      expect(revokeSignatureSet.has(normalizedSignature)).toBe(true);
      expect(authenticatedGrantSignatureSet.has(normalizedSignature)).toBe(
        true,
      );
      expect(anonRevokeSignatureSet.has(normalizedSignature)).toBe(true);
      expect(hasAnonGrantStatementForSignature(migration, signature)).toBe(
        false,
      );
      expect(
        hasEffectiveAnonGrantForSignature(
          effectiveFunctionPrivilegeStates,
          signature,
        ),
      ).toBe(false);
    }

    for (const signature of publicTokenRpcSignatures) {
      const normalizedSignature = normalizeFunctionSignature(signature);

      expect(revokeSignatureSet.has(normalizedSignature)).toBe(true);
      expect(anonRevokeSignatureSet.has(normalizedSignature)).toBe(true);
      expect(publicTokenGrantSignatureSet.has(normalizedSignature)).toBe(true);
    }
  });

  it("keeps RLS helper execute grants explicit for authenticated UI reads", () => {
    const effectiveFunctionPrivilegeStates =
      buildEffectiveFunctionPrivilegeStates(readMigrationHistory());
    const requiredHelperSignatures = [
      "app_private.check_in_settings_permit_method(uuid, uuid, public.check_in_method)",
      "app_private.mark_guest_invitation_needs_regeneration_for_seating(uuid, uuid, uuid, uuid)",
      "app_private.user_can_access_check_in_event(uuid, uuid, uuid, text)",
      "app_private.user_can_access_check_in_event_any(uuid, uuid, uuid, text[])",
      "app_private.user_can_access_file(uuid, uuid, text)",
      "app_private.user_can_access_partner(uuid, uuid, text)",
      "app_private.user_can_access_partner_project(uuid, uuid, text)",
      "app_private.user_can_manage_guest_assignment(uuid, uuid, uuid, text)",
      "app_private.user_can_manage_guest_seating(uuid, uuid, uuid)",
      "app_private.user_can_manage_guest_side(uuid, uuid, public.guest_side)",
      "app_private.user_can_read_guest_import_session(uuid, uuid, public.guest_side, uuid)",
    ].map(normalizeFunctionSignature);

    for (const signature of requiredHelperSignatures) {
      expect(
        hasEffectiveFunctionGrantForRole(
          effectiveFunctionPrivilegeStates,
          signature,
          "authenticated",
        ),
      ).toBe(true);
      expect(
        hasEffectiveFunctionGrantForRole(
          effectiveFunctionPrivilegeStates,
          signature,
          "service_role",
        ),
      ).toBe(true);
      expect(
        hasEffectiveFunctionGrantForRole(
          effectiveFunctionPrivilegeStates,
          signature,
          "public",
        ),
      ).toBe(false);
      expect(
        hasEffectiveFunctionGrantForRole(
          effectiveFunctionPrivilegeStates,
          signature,
          "anon",
        ),
      ).toBe(false);
    }
  });

  it("keeps guest assignment management RLS non-recursive after check-in policies", () => {
    const migration = readMigrationBySuffix(
      "_mvp_ui_qa_rls_route_hardening.sql",
    );
    const normalizedMigration = normalizeSqlStatement(migration);
    const eventAssignmentPolicy =
      normalizedMigration.match(
        /create policy "Guest event assignments managed by assignment managers"[\s\S]*?with check \([\s\S]*?\);/,
      )?.[0] ?? "";
    const tagAssignmentPolicy =
      normalizedMigration.match(
        /create policy "Guest tag assignments managed by tag managers"[\s\S]*?with check \([\s\S]*?\);/,
      )?.[0] ?? "";

    expect(migration).toContain(
      "create or replace function app_private.user_can_manage_guest_assignment",
    );
    expect(eventAssignmentPolicy).toContain(
      "app_private.user_can_manage_guest_assignment",
    );
    expect(tagAssignmentPolicy).toContain(
      "app_private.user_can_manage_guest_assignment",
    );
    expect(eventAssignmentPolicy).not.toContain("from public.guests");
    expect(tagAssignmentPolicy).not.toContain("from public.guests");
  });

  it("keeps bride and groom roles aligned with project detail read access", () => {
    const migration = readMigrationBySuffix(
      "_mvp_ui_qa_bride_groom_project_read_grants.sql",
    );

    for (const role of ["bride", "groom"]) {
      for (const permission of [
        "projects.read",
        "events.read",
        "workflow_tasks.read",
      ]) {
        expect(migration).toContain(`('${role}', '${permission}')`);
      }
    }
  });
});
