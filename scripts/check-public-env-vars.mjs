/**
 * @file Validates NEXT_PUBLIC_* environment variables to prevent restricted
 * service-role/private-key/secret material from being exposed publicly.
 *
 * @requirement TECH-004, TECH-010
 * @backlog EPIC-RELEASE, FEAT-REL-004
 * @sprint Sprint 15 - Release Hardening, QA & MVP Launch
 * @github GitHub issue #31
 *
 * @usage node scripts/check-public-env-vars.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultFileSystem = {
  existsSync,
  readdirSync,
  readFileSync,
};
export const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".cache",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "target",
  "test-results",
]);
// discoverEnvFiles already finds .env.example within maxDepth; this explicit
// list is a safety net for committed examples that move deeper than maxDepth.
export const committedExampleEnvFiles = [".env.example", "apps/web/.env.example"];
export const unsafeExamplePlaceholders = new Set([
  "change-me",
  "changeme",
  "replace-me",
  "replace_me",
  "todo",
  "tbd",
]);
export const restrictedPatterns = [
  /^sb_secret_[A-Za-z0-9_-]{16,}$/i,
  /^service[_-]?role$/i,
  /["']role["']\s*:\s*["']service_role["']/i,
  /["']iss["']\s*:\s*["']supabase["'][\s\S]*["']role["']\s*:\s*["']service_role["']/i,
];

// maxDepth counts directory depth from the supplied root, where root = 0.
export function discoverEnvFiles(
  directory,
  relativePrefix = "",
  currentDepth = 0,
  fileSystem = defaultFileSystem,
  maxDepth = 4,
) {
  let entries;

  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    entries = fileSystem.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    // display-only path for diagnostics; filesystem reads use absolutePath or
    // path.join(repoRoot, display path) so Windows and POSIX separators normalize.
    const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        return [];
      }

      return discoverEnvFiles(
        absolutePath,
        relativePath,
        currentDepth + 1,
        fileSystem,
        maxDepth,
      );
    }

    if (entry.isFile() && (entry.name === ".env" || entry.name.startsWith(".env."))) {
      return [relativePath];
    }

    return [];
  });
}

export function listEnvFiles({
  fileSystem = defaultFileSystem,
  repoRoot = defaultRepoRoot,
} = {}) {
  const envFiles = new Set(discoverEnvFiles(repoRoot, "", 0, fileSystem));

  for (const relativePath of committedExampleEnvFiles) {
    if (fileSystem.existsSync(join(repoRoot, relativePath))) {
      envFiles.add(relativePath);
    }
  }

  return [...envFiles].sort();
}

export function hasPrivateKeyBlock(value) {
  return (
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(value) ||
    /-----END [A-Z ]*PRIVATE KEY-----/i.test(value)
  );
}

export function hasServiceRoleJwt(value) {
  return value.split(/\s+/).some((token) => {
    const parts = token.split(".");

    if (parts.length !== 3 || !parts.every(Boolean)) {
      return false;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      );

      return Object.entries(payload).some(([key, claimValue]) => {
        const normalizedKey = key.toLowerCase();
        const normalizedValue =
          typeof claimValue === "string"
            ? claimValue.toLowerCase()
            : JSON.stringify(claimValue).toLowerCase();

        return (
          normalizedKey.includes("service_role") ||
          normalizedValue.includes("service_role")
        );
      });
    } catch {
      return false;
    }
  });
}

export function containsRestrictedToken(value) {
  return (
    restrictedPatterns.some((pattern) => pattern.test(value)) ||
    hasPrivateKeyBlock(value) ||
    hasServiceRoleJwt(value)
  );
}

export function hasRestrictedPublicName(name) {
  const upperName = name.toUpperCase();
  const forbiddenMarkers = [
    "PRIVATE",
    "SERVICE_ROLE",
    "SERVICE_ROLE_KEY",
    "SECRET",
    "SIGNING_PRIVATE",
    "SIGNING",
  ];

  return forbiddenMarkers.some((marker) => upperName.includes(marker));
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasUnsafePublicExamplePlaceholder(value) {
  const normalizedValue = value.trim().toLowerCase();

  return [...unsafeExamplePlaceholders].some((token) =>
    new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`).test(
      normalizedValue,
    ),
  );
}

export function normalizeEnvValue(value) {
  const trimmed = value.trim();
  // Simple paired-quote stripping. It intentionally does not unescape escaped
  // quotes; accepting false positives is safer than stripping secret-like text.
  const pairedQuoteMatch = trimmed.match(/^(['"])([\s\S]*)\1$/);

  return pairedQuoteMatch ? pairedQuoteMatch[2] : trimmed;
}

// Intentionally do not strip inline comments from quoted values such as
// NEXT_PUBLIC_FOO="value" # note. normalizeEnvValue will then keep the trailing
// comment, which can produce a false positive. That is preferable to removing
// text from a quoted secret-like value and creating a false negative.
export function stripUnquotedInlineComment(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
    return trimmed;
  }

  return trimmed.replace(/(^|\s)#.*$/u, "").trim();
}

export function checkPublicVariable(
  source,
  name,
  value,
  {
    rejectUnsafePublicExamplePlaceholder = false,
    violations = [],
  } = {},
) {
  const normalizedName = name.trim().replace(/^export\s+/i, "");
  const normalizedValue = normalizeEnvValue(value);
  const isPublicVariable = normalizedName.startsWith("NEXT_PUBLIC_");

  if (!isPublicVariable) {
    return violations;
  }

  if (
    hasRestrictedPublicName(normalizedName) ||
    containsRestrictedToken(normalizedValue) ||
    (rejectUnsafePublicExamplePlaceholder &&
      hasUnsafePublicExamplePlaceholder(normalizedValue))
  ) {
    violations.push(`${source}: ${normalizedName}`);
  }

  return violations;
}

export function runPublicEnvCheck({
  env = process.env,
  fileSystem = defaultFileSystem,
  logger = console,
  repoRoot = defaultRepoRoot,
} = {}) {
  const violations = [];

  // Runtime environment values can reach Next.js during CI or local builds even
  // when no .env file is present, so scan them before committed/local files.
  for (const [name, value] of Object.entries(env)) {
    checkPublicVariable("process.env", name, value ?? "", { violations });
  }

  for (const relativePath of listEnvFiles({ fileSystem, repoRoot })) {
    const absolutePath = join(repoRoot, relativePath);
    const rejectUnsafePublicExamplePlaceholder =
      relativePath.endsWith(".env.example");

    const lines = fileSystem.readFileSync(absolutePath, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      // Simple KEY=VALUE parser: splits on the first '=' and does not implement
      // full dotenv quoting or multiline semantics. That is enough for this scan
      // because it looks for service-role markers, JWT payloads, and PEM markers.
      const equalsIndex = trimmed.indexOf("=");

      if (equalsIndex < 0) {
        return;
      }

      checkPublicVariable(
        `${relativePath}:${index + 1}`,
        trimmed.slice(0, equalsIndex).trim(),
        stripUnquotedInlineComment(trimmed.slice(equalsIndex + 1)),
        { rejectUnsafePublicExamplePlaceholder, violations },
      );
    });
  }

  if (violations.length > 0) {
    logger.error(
      "Public environment variable check failed. Remove restricted service-role/private-key material or unsafe example placeholders from NEXT_PUBLIC_* variables:",
    );
    for (const violation of violations) {
      logger.error(`- ${violation}`);
    }

    return { ok: false, violations };
  }

  logger.log("Public environment variable check passed.");

  return { ok: true, violations };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runPublicEnvCheck();

  if (!result.ok) {
    process.exitCode = 1;
  }
}
