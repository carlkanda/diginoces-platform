#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const [webScript, ...webArgs] = process.argv.slice(2);

if (!webScript) {
  console.error(
    "Usage: node scripts/run-web-script-with-root-env.mjs <script>",
  );
  process.exit(1);
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const result = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      result[key] = value;
    }
  }

  return result;
}

const rootEnv = {
  ...parseEnvFile(resolve(".env")),
  ...parseEnvFile(resolve(".env.local")),
};
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npmArgs = [
  "--workspace",
  "apps/web",
  "run",
  webScript,
  ...(webArgs.length > 0 ? ["--", ...webArgs] : []),
];
const command =
  process.platform === "win32"
    ? (process.env.ComSpec ?? "cmd.exe")
    : npmCommand;
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", npmCommand, ...npmArgs]
    : npmArgs;

const child = spawn(command, args, {
  env: {
    ...rootEnv,
    ...process.env,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
