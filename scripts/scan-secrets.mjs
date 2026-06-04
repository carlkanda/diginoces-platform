#!/usr/bin/env node
/**
 * @file Runs a maintainable targeted secret scan with focused rg patterns.
 *
 * @requirement TECH-004, TECH-010
 * @backlog EPIC-RELEASE, FEAT-REL-004
 * @sprint Sprint 15 - Release Hardening, QA & MVP Launch
 * @github GitHub issue #31
 *
 * @usage node scripts/scan-secrets.mjs
 */
import { spawnSync } from "node:child_process";

const patterns = [
  "service[-_ ]?role key",
  "service_role key",
  "supabase_service_role",
  "database password",
  "db_password",
  "whatsapp token",
  "google secret",
  "api secret",
  "api[_-]?key.*[A-Za-z0-9]{20,}",
  "client_secret",
  "private key",
  "BEGIN [A-Z ]*PRIVATE KEY",
  "BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY",
  "ssh-rsa",
  "AKIA[0-9A-Z]{16}",
  "bearer[[:space:]]+[A-Za-z0-9._~+/-]+",
  "jwt.*ey[A-Za-z0-9_-]",
  "eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+",
  "sk_live",
  "sk_test",
  "real guest",
  "real client",
  "real couple",
];

// This local scan is intentionally source/config focused. Gitleaks scans the
// whole repository, including docs, with placeholder allowlists kept in config.
const excludedGlobs = [
  "!node_modules/**",
  "!apps/web/.next/**",
  "!docs/**",
  "!AGENTS.md",
  "!README.md",
  "!.env.example",
  "!apps/web/.env.example",
  "!package-lock.json",
  "!apps/web/src/lib/platform/public-env-check.test.ts",
  "!scripts/check-public-env-vars.mjs",
  "!supabase/config.toml",
  "!.gitleaks.toml",
  "!scripts/scan-secrets.mjs",
];

function printRipgrepInstallHelp(error) {
  const detail = error ? ` (${error.message})` : "";

  console.error(`Failed to run ripgrep (rg)${detail}.`);
  console.error(
    "Install ripgrep before running npm run secrets:scan: macOS `brew install ripgrep`, Debian/Ubuntu `sudo apt-get install ripgrep`, or Windows `winget install BurntSushi.ripgrep.MSVC`.",
  );
}

const ripgrepCheck = spawnSync("rg", ["--version"], { encoding: "utf8" });

if (ripgrepCheck.error) {
  printRipgrepInstallHelp(ripgrepCheck.error);
  process.exitCode = 1;
  process.exit();
}

if (ripgrepCheck.status !== 0) {
  printRipgrepInstallHelp();
  process.stderr.write(ripgrepCheck.stderr);
  process.exitCode = 1;
  process.exit();
}

let found = false;

for (const pattern of patterns) {
  const result = spawnSync(
    "rg",
    [
      "-n",
      "-i",
      pattern,
      ...excludedGlobs.flatMap((glob) => ["--glob", glob]),
      ".",
    ],
    { encoding: "utf8" },
  );

  if (result.error) {
    printRipgrepInstallHelp(result.error);
    process.exitCode = 1;
    process.exit();
  }

  if (result.status === 0) {
    found = true;
    console.error(`Potential secret pattern matched: ${pattern}`);
    process.stderr.write(result.stdout);
  } else if (result.status !== 1) {
    console.error(`rg failed for pattern "${pattern}" with status ${result.status}.`);
    process.stderr.write(result.stderr);
    process.exitCode = 1;
    process.exit();
  }
}

if (found) {
  console.error("Targeted secret scan found potential matches.");
  process.exitCode = 1;
} else {
  console.log("Targeted secret scan passed.");
}
