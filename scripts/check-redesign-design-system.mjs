#!/usr/bin/env node
/**
 * @file Scans local redesign UI source for Impeccable/shadcn anti-patterns.
 *
 * The scan is intentionally conservative: it blocks route-level decorative
 * patterns and raw visual shortcuts, while allowing shadcn overlay internals
 * where blur/dim behavior is infrastructure rather than page decoration.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = fileURLToPath(new URL("../", import.meta.url));

const scanRoots = [
  "apps/web/src/app",
  "apps/web/src/components",
  "apps/web/src/lib/rsvp",
];

const ignoredPathParts = new Set([".next", "api", "__snapshots__"]);
const ignoredFilePatterns = [/\.test\.[tj]sx?$/u, /\.spec\.[tj]sx?$/u];

const overlayInfrastructureFiles = new Set([
  "apps/web/src/components/ui/dialog.tsx",
  "apps/web/src/components/ui/sheet.tsx",
]);

function isFunctionalSeatingGrid({ line, relativePath }) {
  return (
    relativePath === "apps/web/src/app/globals.css" &&
    (line.includes("linear-gradient(var(--panel-strong) 1px") ||
      line.includes("linear-gradient(90deg, var(--panel-strong) 1px"))
  );
}

const rules = [
  {
    id: "decorative-gradient",
    message:
      "Avoid decorative gradients in product routes; use semantic surfaces and state tokens.",
    pattern:
      /\b(?:repeating-)?(?:linear|radial)-gradient\s*\(|\bbg-\[(?:repeating-)?(?:linear|radial)-gradient/iu,
    allow: isFunctionalSeatingGrid,
  },
  {
    id: "gradient-text",
    message: "Gradient text is banned; use solid semantic text color.",
    pattern: /\bbg-clip-text\b|background-clip\s*:\s*text/iu,
  },
  {
    id: "decorative-glass",
    message:
      "Backdrop blur/glass effects are only allowed for overlay infrastructure, not page decoration.",
    pattern: /\bbackdrop-blur|supports-backdrop-filter|\bglass(?:morphism)?\b/iu,
    allow: ({ relativePath }) => overlayInfrastructureFiles.has(relativePath),
  },
  {
    id: "side-stripe-border",
    message:
      "Side-stripe accent borders are banned; use full borders, badges, icons, or state rows.",
    pattern: /\bborder-[lr]-[2-9]\b/iu,
  },
  {
    id: "over-rounded-surface",
    message:
      "Cards and panels should not use 32px+ radii; keep product surfaces within the design system scale.",
    pattern:
      /\brounded-\[(?:3[2-9]|[4-9]\d)px\]|\bborder-radius\s*:\s*(?:3[2-9]|[4-9]\d)px|\brounded-\[(?:2(?:\.\d+)?|[3-9])rem\]/iu,
  },
  {
    id: "tailwind-space-stack",
    message: "Use flex/grid with gap utilities instead of space-x/space-y stacks.",
    pattern: /\bspace-[xy]-/iu,
  },
  {
    id: "raw-palette-class",
    message:
      "Use semantic shadcn tokens instead of raw palette utilities in redesigned product UI.",
    pattern:
      /\b(?:bg|text|border|ring)-(?:black|white|red|blue|purple|pink|orange|amber|green|emerald|teal|cyan|sky|gray|slate|zinc|neutral|stone)(?:-\d{2,3})?(?:\/\d{1,3})?\b/iu,
    allow: ({ relativePath }) => overlayInfrastructureFiles.has(relativePath),
  },
];

function listFiles(directory, { repoRoot }) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    const relativePath = toDisplayPath(absolutePath, repoRoot);
    const pathParts = relativePath.split("/");

    if (pathParts.some((part) => ignoredPathParts.has(part))) {
      return [];
    }

    if (entry.isDirectory()) {
      return listFiles(absolutePath, { repoRoot });
    }

    if (
      !entry.isFile() ||
      !/\.(?:tsx?|jsx?|css)$/u.test(entry.name) ||
      ignoredFilePatterns.some((pattern) => pattern.test(entry.name))
    ) {
      return [];
    }

    return [absolutePath];
  });
}

function toDisplayPath(absolutePath, repoRoot) {
  return absolutePath.replace(repoRoot, "").replaceAll("\\", "/");
}

export function runDesignSystemScan({ repoRoot = defaultRepoRoot } = {}) {
  const files = scanRoots.flatMap((relativeRoot) =>
    listFiles(join(repoRoot, relativeRoot), { repoRoot }),
  );
  const findings = [];

  for (const absolutePath of files) {
    const relativePath = toDisplayPath(absolutePath, repoRoot);
    const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/u);

    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (!rule.pattern.test(line)) {
          continue;
        }

        if (rule.allow?.({ line, relativePath })) {
          continue;
        }

        findings.push({
          id: rule.id,
          line: index + 1,
          message: rule.message,
          path: relativePath,
          source: line.trim(),
        });
      }
    });
  }

  return findings;
}

function printFindings(findings) {
  if (findings.length === 0) {
    console.log("Redesign design-system scan passed: no blocked patterns found.");
    return;
  }

  console.error("Redesign design-system scan failed:");
  for (const finding of findings) {
    console.error(
      `- ${finding.path}:${finding.line} [${finding.id}] ${finding.message}`,
    );
    console.error(`  ${finding.source}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  printFindings(runDesignSystemScan());
}
