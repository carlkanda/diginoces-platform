#!/usr/bin/env node
/**
 * @file Verifies local redesign review evidence before any hosted deployment.
 *
 * @usage node scripts/check-redesign-readiness.mjs
 * @usage node scripts/check-redesign-readiness.mjs --require-approval
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runDesignSystemScan } from "./check-redesign-design-system.mjs";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const requireApproval = process.argv.includes("--require-approval");

const requiredArtifacts = [
  "PRODUCT.md",
  "DESIGN.md",
  ".impeccable/design.json",
  "apps/web/components.json",
  "apps/web/src/app/globals.css",
  "apps/web/src/app/workspace-app-sidebar.tsx",
  "scripts/check-redesign-design-system.mjs",
  "docs/qa/redesign-rebuild-checklist.md",
  "docs/qa/local-redesign-qa-evidence.md",
  "docs/qa/local-redesign-review-handoff.md",
  "docs/qa/local-redesign-readiness-audit.md",
  "docs/qa/local-redesign-route-review-pack.md",
  "docs/qa/local-redesign-review-session-guide.md",
  "docs/qa/local-redesign-user-acceptance-checklist.md",
  "docs/qa/local-redesign-post-approval-runbook.md",
  "docs/qa/local-redesign-completion-audit.md",
];

const checklistPath = join(repoRoot, "docs/qa/redesign-rebuild-checklist.md");
const qaEvidencePath = join(repoRoot, "docs/qa/local-redesign-qa-evidence.md");
const handoffPath = join(repoRoot, "docs/qa/local-redesign-review-handoff.md");
const auditPath = join(repoRoot, "docs/qa/local-redesign-readiness-audit.md");
const routeReviewPackPath = join(
  repoRoot,
  "docs/qa/local-redesign-route-review-pack.md",
);
const reviewSessionGuidePath = join(
  repoRoot,
  "docs/qa/local-redesign-review-session-guide.md",
);
const acceptancePath = join(
  repoRoot,
  "docs/qa/local-redesign-user-acceptance-checklist.md",
);
const runbookPath = join(
  repoRoot,
  "docs/qa/local-redesign-post-approval-runbook.md",
);
const completionAuditPath = join(
  repoRoot,
  "docs/qa/local-redesign-completion-audit.md",
);
const productPath = join(repoRoot, "PRODUCT.md");
const designPath = join(repoRoot, "DESIGN.md");
const designJsonPath = join(repoRoot, ".impeccable/design.json");
const componentsJsonPath = join(repoRoot, "apps/web/components.json");

const failures = [];
const reviewSessionIds = [
  {
    name: "project",
    placeholder: "[projectId]",
    value: "de3378cd-ea21-4982-b507-a178eb88a34c",
  },
  {
    name: "event",
    placeholder: "[eventId]",
    value: "088aebc4-05d9-45c2-b73a-803f73706163",
  },
  {
    name: "guest",
    placeholder: "[guestId]",
    value: "4271cbfd-c672-4dde-86d0-aad2406124b9",
  },
  {
    name: "import",
    placeholder: "[importId]",
    value: "489eaf2e-d8c0-4816-9eb6-9ab867506347",
  },
  {
    name: "invitation template",
    placeholder: "[templateId]",
    value: "61993173-1efb-4d18-b7d2-672907320ea8",
  },
  {
    name: "file",
    placeholder: "[fileId]",
    value: "fad37564-d42c-40a8-8a46-334a12fbd2c8",
  },
];
const internalProductCopyPatterns = [
  /\bsprints?\b/iu,
  /\bfoundation\b/iu,
  /\bMVP\b/u,
  /\bbacklog\b/iu,
  /\bissues?\b/iu,
  /\bPR\b/u,
  /\bimplementation\b/iu,
  /\bmigrations?\b/iu,
  /\bhardening\b/iu,
  /\bscaffold\b/iu,
  /\btest cases?\b/iu,
];
const staleQaEvidencePhrases = [
  "Live browser verification remains pending",
  "live browser verification remains pending",
  "final live seating recheck remains pending",
  "in-app browser URL policy",
  "current account has no visible partner profile link",
];

function assertCountMatch({
  actualBlockedCount,
  actualRouteCount,
  description,
  pattern,
  source,
}) {
  const match = source.match(pattern);

  if (!match) {
    failures.push(`${description} does not record route-table counts.`);
    return;
  }

  const recordedRouteCount = Number.parseInt(match[1], 10);
  const recordedBlockedCount = Number.parseInt(match[2], 10);

  if (
    recordedRouteCount !== actualRouteCount ||
    recordedBlockedCount !== actualBlockedCount
  ) {
    failures.push(
      `${description} route-table counts are stale: recorded ${recordedRouteCount} verified / ${recordedBlockedCount} blocked, actual ${actualRouteCount} verified / ${actualBlockedCount} blocked.`,
    );
  }
}

function parseMarkdownTableRow(line) {
  return line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((column) => column.trim());
}

function routeFromPagePath(absolutePath) {
  const appRoot = join(repoRoot, "apps/web/src/app");
  const relativePath = relative(appRoot, absolutePath).replaceAll("\\", "/");

  if (relativePath === "page.tsx") {
    return "/";
  }

  if (!relativePath.endsWith("/page.tsx")) {
    return null;
  }

  const routePath = relativePath.replace(/\/page\.tsx$/u, "");
  const segments = routePath
    .split("/")
    .filter(
      (segment) =>
        segment.length > 0 &&
        !(segment.startsWith("(") && segment.endsWith(")")),
    );

  return `/${segments.join("/")}`;
}

function getAppPageRoutes() {
  const appRoot = join(repoRoot, "apps/web/src/app");

  return listFiles(appRoot, {
    ignore: (absolutePath) =>
      absolutePath.split(/[\\/]/u).includes("api") ||
      absolutePath.split(/[\\/]/u).includes(".next"),
  })
    .filter((absolutePath) => absolutePath.endsWith(`${join("", "page.tsx")}`))
    .map(routeFromPagePath)
    .filter(Boolean)
    .sort();
}

function getRouteFromRow(line) {
  const [route] = parseMarkdownTableRow(line);
  return route.replaceAll("`", "");
}

function validateRouteCoverage(routeRows) {
  const tableRoutes = routeRows.map(getRouteFromRow).sort();
  const appPageRoutes = getAppPageRoutes();
  const tableRouteSet = new Set(tableRoutes);
  const appPageRouteSet = new Set(appPageRoutes);
  const duplicateRoutes = tableRoutes.filter(
    (route, index) => tableRoutes.indexOf(route) !== index,
  );
  const missingRoutes = appPageRoutes.filter((route) => !tableRouteSet.has(route));
  const extraRoutes = tableRoutes.filter((route) => !appPageRouteSet.has(route));

  if (duplicateRoutes.length > 0) {
    failures.push(
      `Route table has duplicate route row(s): ${[...new Set(duplicateRoutes)].join(", ")}.`,
    );
  }

  if (missingRoutes.length > 0) {
    failures.push(
      `Route table is missing app page route(s): ${missingRoutes.join(", ")}.`,
    );
  }

  if (extraRoutes.length > 0) {
    failures.push(
      `Route table includes route(s) without matching app page files: ${extraRoutes.join(", ")}.`,
    );
  }
}

function validateRouteReviewPack(routeRows, source) {
  const tableRoutes = routeRows.map(getRouteFromRow).sort();
  const routePackRoutes = [
    ...new Set(
      [...source.matchAll(/\| `([^`]+)` \|/gu)]
        .map((match) => match[1])
        .filter((route) => route.startsWith("/")),
    ),
  ].sort();
  const tableRouteSet = new Set(tableRoutes);
  const routePackRouteSet = new Set(routePackRoutes);
  const missingRoutes = tableRoutes.filter(
    (route) => !routePackRouteSet.has(route),
  );
  const extraRoutes = routePackRoutes.filter(
    (route) => !tableRouteSet.has(route),
  );

  if (missingRoutes.length > 0) {
    failures.push(
      `Route review pack is missing route(s): ${missingRoutes.join(", ")}.`,
    );
  }

  if (extraRoutes.length > 0) {
    failures.push(
      `Route review pack includes route(s) outside the authoritative route table: ${extraRoutes.join(", ")}.`,
    );
  }
}

function normalizeReviewSessionGuide(source) {
  return reviewSessionIds.reduce(
    (normalized, reviewId) =>
      normalized.replaceAll(reviewId.value, reviewId.placeholder),
    source,
  );
}

function validateReviewSessionGuide(routeRows, source) {
  const normalizedSource = normalizeReviewSessionGuide(source);
  const tableRoutes = routeRows.map(getRouteFromRow).sort();
  const missingRoutes = tableRoutes.filter(
    (route) => !normalizedSource.includes(route),
  );

  if (missingRoutes.length > 0) {
    failures.push(
      `Local review session guide is missing route(s): ${missingRoutes.join(", ")}.`,
    );
  }

  for (const reviewId of reviewSessionIds) {
    if (!source.includes(reviewId.value)) {
      failures.push(
        `Local review session guide is missing the safe dev ${reviewId.name} ID.`,
      );
    }
  }

  if (!source.includes("carlkanda@gmail.com")) {
    failures.push("Local review session guide does not name the dev review account.");
  }

  if (!source.includes("diginoces_admin")) {
    failures.push(
      "Local review session guide does not record the dev admin role assignment.",
    );
  }

  if (!source.includes("Do not record public guest token values")) {
    failures.push(
      "Local review session guide does not state the public guest-token rule.",
    );
  }

  if (!source.includes("/g/[guestToken]")) {
    failures.push("Local review session guide does not reference /g/[guestToken].");
  }

  if (/\/g\/[A-Za-z0-9_-]{16,}/u.test(source)) {
    failures.push(
      "Local review session guide appears to contain a concrete public guest token.",
    );
  }
}

function validateScreenshotReferences(source) {
  const screenshotReferences = [
    ...new Set(
      [...source.matchAll(/`(output\/playwright\/[^`]+)`/gu)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
  const missingScreenshots = screenshotReferences.filter(
    (reference) => !existsSync(join(repoRoot, reference)),
  );

  if (missingScreenshots.length > 0) {
    failures.push(
      `Checklist references missing browser screenshot artifact(s): ${missingScreenshots.join(", ")}.`,
    );
  }
}

function validateRouteRows(routeRows) {
  const evidencePattern =
    /\b(?:preserved|verified|browser|screenshot|redirect|overflow|permission|public token|authenticated|mobile|desktop|field names?|server action|route protection|shell hidden|no blocked)\b/iu;

  routeRows.forEach((line, index) => {
    const rowNumber = index + 1;
    const columns = parseMarkdownTableRow(line);

    if (columns.length !== 5) {
      failures.push(
        `Route table row ${rowNumber} should have 5 columns, found ${columns.length}.`,
      );
      return;
    }

    const [route, purpose, shadcnPattern, status, notes] = columns;

    if (!/^`\/[^`]*`$/u.test(route)) {
      failures.push(`Route table row ${rowNumber} has an invalid route cell.`);
    }

    if (purpose.length < 24 || /\b(?:tbd|todo|pending)\b/iu.test(purpose)) {
      failures.push(
        `Route table row ${rowNumber} has weak or unfinished purpose evidence for ${route}.`,
      );
    }

    if (
      shadcnPattern.length < 24 ||
      !/`[A-Z][A-Za-z0-9]+`/u.test(shadcnPattern)
    ) {
      failures.push(
        `Route table row ${rowNumber} does not record concrete shadcn component choices for ${route}.`,
      );
    }

    if (status !== "Browser verified") {
      failures.push(
        `Route table row ${rowNumber} for ${route} is not Browser verified.`,
      );
    }

    if (notes.length < 80 || !evidencePattern.test(notes)) {
      failures.push(
        `Route table row ${rowNumber} has weak browser/behavior evidence notes for ${route}.`,
      );
    }
  });
}

function readJson(relativePath, absolutePath) {
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    failures.push(`Could not parse ${relativePath}: ${error.message}`);
    return null;
  }
}

function listFiles(directory, { ignore = () => false } = {}) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    if (ignore(absolutePath)) {
      return [];
    }

    if (entry.isDirectory()) {
      return listFiles(absolutePath, { ignore });
    }

    return entry.isFile() ? [absolutePath] : [];
  });
}

function toDisplayPath(absolutePath) {
  return absolutePath.replace(repoRoot, "").replaceAll("\\", "/");
}

function isLikelyNonVisibleSourceLine(line) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("export ") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.includes(' from "@/') ||
    trimmed.includes(" from '@/")
  );
}

function scanProductCopy() {
  const routeRoot = join(repoRoot, "apps/web/src/app");
  const files = [
    ...listFiles(routeRoot, {
      ignore: (absolutePath) =>
        absolutePath.split(/[\\/]/u).includes("api") ||
        absolutePath.split(/[\\/]/u).includes(".next"),
    }),
    join(repoRoot, "apps/web/src/lib/rsvp/public-guest-page-view.tsx"),
    join(repoRoot, "apps/web/src/app/workspace-app-sidebar.tsx"),
  ].filter(
    (absolutePath) =>
      existsSync(absolutePath) && /\.(tsx?|jsx?)$/u.test(absolutePath),
  );

  const matches = [];

  for (const absolutePath of files) {
    readFileSync(absolutePath, "utf8")
      .split(/\r?\n/u)
      .forEach((line, index) => {
        if (isLikelyNonVisibleSourceLine(line)) {
          return;
        }

        const matchedPattern = internalProductCopyPatterns.find((pattern) =>
          pattern.test(line),
        );

        if (matchedPattern) {
          matches.push(
            `${toDisplayPath(absolutePath)}:${index + 1}: ${line.trim()}`,
          );
        }
      });
  }

  if (matches.length > 0) {
    failures.push(
      `Potential internal delivery wording remains in route-facing source:\n${matches.join("\n")}`,
    );
  }
}

for (const relativePath of requiredArtifacts) {
  if (!existsSync(join(repoRoot, relativePath))) {
    failures.push(`Missing required redesign artifact: ${relativePath}`);
  }
}

if (failures.length === 0) {
  const checklist = readFileSync(checklistPath, "utf8");
  const qaEvidence = readFileSync(qaEvidencePath, "utf8");
  const handoff = readFileSync(handoffPath, "utf8");
  const audit = readFileSync(auditPath, "utf8");
  const routeReviewPack = readFileSync(routeReviewPackPath, "utf8");
  const reviewSessionGuide = readFileSync(reviewSessionGuidePath, "utf8");
  const acceptance = readFileSync(acceptancePath, "utf8");
  const runbook = readFileSync(runbookPath, "utf8");
  const completionAudit = readFileSync(completionAuditPath, "utf8");
  const product = readFileSync(productPath, "utf8");
  const design = readFileSync(designPath, "utf8");
  const designJson = readJson(".impeccable/design.json", designJsonPath);
  const componentsJson = readJson("apps/web/components.json", componentsJsonPath);
  const routeRows = checklist
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("| `/"));
  const browserVerifiedRows = routeRows.filter((line) =>
    line.includes("| Browser verified |"),
  );
  const blockedRows = routeRows.filter((line) => line.includes("| Blocked |"));

  if (routeRows.length === 0) {
    failures.push("Redesign checklist has no route rows.");
  }

  if (browserVerifiedRows.length !== routeRows.length) {
    failures.push(
      `Route table is not fully browser verified: ${browserVerifiedRows.length}/${routeRows.length}.`,
    );
  }

  if (blockedRows.length > 0) {
    failures.push(`Route table still has ${blockedRows.length} blocked route(s).`);
  }

  validateRouteCoverage(routeRows);
  validateRouteRows(routeRows);
  validateRouteReviewPack(routeRows, routeReviewPack);
  validateReviewSessionGuide(routeRows, reviewSessionGuide);
  validateScreenshotReferences(checklist);

  const staleQaEvidence = staleQaEvidencePhrases.filter((phrase) =>
    qaEvidence.includes(phrase),
  );

  if (staleQaEvidence.length > 0) {
    failures.push(
      `Local redesign QA evidence still contains stale blocker wording: ${staleQaEvidence.join(", ")}.`,
    );
  }

  if (!qaEvidence.includes("authoritative route table")) {
    failures.push(
      "Local redesign QA evidence does not point stale route evidence back to the authoritative route table.",
    );
  }

  if (!checklist.includes("Final Status Reconciliation")) {
    failures.push("Checklist is missing the final status reconciliation note.");
  }

  if (
    !checklist.includes(
      "The remaining work is user review and approval before any hosted deployment.",
    ) &&
    !checklist.includes(
      "Hosted deployment preparation has been requested and approved.",
    )
  ) {
    failures.push("Checklist does not preserve the user-approval deployment gate.");
  }

  if (
    !handoff.includes("Do not deploy this redesign to the hosted app") &&
    !handoff.includes("Hosted deployment preparation is approved")
  ) {
    failures.push("Review handoff does not state the hosted deployment gate.");
  }

  if (
    !audit.includes("Hosted deployment remains gated on user approval.") &&
    !audit.includes("Hosted deployment preparation is approved")
  ) {
    failures.push("Readiness audit does not state the hosted deployment gate.");
  }

  if (
    !handoff.includes("docs/qa/local-redesign-user-acceptance-checklist.md")
  ) {
    failures.push("Review handoff does not reference the user acceptance checklist.");
  }

  if (!handoff.includes("docs/qa/local-redesign-route-review-pack.md")) {
    failures.push("Review handoff does not reference the route review pack.");
  }

  if (!handoff.includes("docs/qa/local-redesign-review-session-guide.md")) {
    failures.push("Review handoff does not reference the review session guide.");
  }

  if (
    !audit.includes("docs/qa/local-redesign-user-acceptance-checklist.md")
  ) {
    failures.push("Readiness audit does not reference the user acceptance checklist.");
  }

  if (!audit.includes("docs/qa/local-redesign-route-review-pack.md")) {
    failures.push("Readiness audit does not reference the route review pack.");
  }

  if (!audit.includes("docs/qa/local-redesign-review-session-guide.md")) {
    failures.push("Readiness audit does not reference the review session guide.");
  }

  if (
    !acceptance.includes("Do not deploy this redesign to the hosted app") &&
    !acceptance.includes(
      "Hosted deployment preparation has been requested and approved.",
    )
  ) {
    failures.push("User acceptance checklist does not preserve the deployment gate.");
  }

  if (!acceptance.includes("docs/qa/local-redesign-route-review-pack.md")) {
    failures.push("User acceptance checklist does not reference the route review pack.");
  }

  if (!acceptance.includes("docs/qa/local-redesign-review-session-guide.md")) {
    failures.push(
      "User acceptance checklist does not reference the review session guide.",
    );
  }

  if (!acceptance.includes("I accept the local redesign direction")) {
    failures.push("User acceptance checklist is missing final approval criteria.");
  }

  if (!handoff.includes("docs/qa/local-redesign-post-approval-runbook.md")) {
    failures.push("Review handoff does not reference the post-approval runbook.");
  }

  if (!audit.includes("docs/qa/local-redesign-post-approval-runbook.md")) {
    failures.push("Readiness audit does not reference the post-approval runbook.");
  }

  if (!audit.includes("docs/qa/local-redesign-completion-audit.md")) {
    failures.push("Readiness audit does not reference the completion audit.");
  }

  if (!handoff.includes("docs/qa/local-redesign-completion-audit.md")) {
    failures.push("Review handoff does not reference the completion audit.");
  }

  if (!runbook.includes("npm run redesign:check:approval")) {
    failures.push("Post-approval runbook does not include the strict approval gate.");
  }

  if (!runbook.includes("npm run redesign:design-system-check")) {
    failures.push("Post-approval runbook does not include the design-system scan.");
  }

  if (!runbook.includes("docs/qa/local-redesign-route-review-pack.md")) {
    failures.push("Post-approval runbook does not reference the route review pack.");
  }

  if (!runbook.includes("docs/qa/local-redesign-review-session-guide.md")) {
    failures.push("Post-approval runbook does not reference the review session guide.");
  }

  if (
    (!runbook.includes("separate explicit user-approved step") &&
      !runbook.includes("Hosted deployment preparation has been separately approved")) ||
    (!runbook.includes("Keep production unchanged") &&
      !runbook.includes("Production promotion may proceed only after"))
  ) {
    failures.push(
      "Post-approval runbook does not preserve the separate hosted deployment approval gate.",
    );
  }

  if (!completionAudit.includes("Requirement Evidence Matrix")) {
    failures.push("Completion audit is missing the requirement evidence matrix.");
  }

  if (
    !completionAudit.includes("Final goal completion is not yet proven") &&
    !completionAudit.includes("Local redesign goal completion is proven")
  ) {
    failures.push(
      "Completion audit does not state either pending or approved completion status.",
    );
  }

  if (
    !completionAudit.includes("User acceptance is the only remaining completion gate") &&
    !completionAudit.includes("Both final approval boxes are checked")
  ) {
    failures.push(
      "Completion audit does not identify either the pending user acceptance gate or the recorded final approval.",
    );
  }

  if (!completionAudit.includes("npm run redesign:design-system-check")) {
    failures.push("Completion audit does not record the design-system scan.");
  }

  if (!completionAudit.includes("docs/qa/local-redesign-route-review-pack.md")) {
    failures.push("Completion audit does not reference the route review pack.");
  }

  if (!completionAudit.includes("docs/qa/local-redesign-review-session-guide.md")) {
    failures.push("Completion audit does not reference the review session guide.");
  }

  if (!audit.includes("design-system scan for blocked generic UI patterns")) {
    failures.push("Readiness audit does not record the design-system scan.");
  }

  const hasPendingReviewStatus =
    acceptance.includes("Status: Pending user review") &&
    acceptance.includes("Pending user approval.");
  const hasFinalDirectionApproval = /^- \[[xX]\] I accept the local redesign direction\.$/mu.test(
    acceptance,
  );
  const hasDeploymentPreparationApproval =
    /^- \[[xX]\] I approve preparing the redesign for hosted deployment in a separate deployment step\.$/mu.test(
      acceptance,
    );

  if (
    !hasPendingReviewStatus &&
    !(hasFinalDirectionApproval && hasDeploymentPreparationApproval)
  ) {
    failures.push(
      "User acceptance checklist must show either pending review status or checked final approval boxes.",
    );
  }

  if (requireApproval) {
    if (!hasFinalDirectionApproval || !hasDeploymentPreparationApproval) {
      failures.push(
        "Strict approval mode requires both final local approval checkboxes to be checked.",
      );
    }

    if (acceptance.includes("Pending user approval.")) {
      failures.push(
        "Strict approval mode requires the final approval note to be updated from pending.",
      );
    }
  }

  if (!/^## Register\s+product/mu.test(product)) {
    failures.push("PRODUCT.md does not declare the product register.");
  }

  if (
    !product.includes("Do not update the hosted application") &&
    !product.includes("hosted deployment preparation is now approved")
  ) {
    failures.push("PRODUCT.md does not preserve the hosted deployment gate.");
  }

  if (!design.includes("register: product")) {
    failures.push("DESIGN.md does not declare the product register.");
  }

  if (designJson) {
    if (designJson.register !== "product") {
      failures.push(".impeccable/design.json does not use the product register.");
    }

    if (
      designJson.resetId !== "REDESIGN-RESET-2026-06-19-CURRENT-GOAL-REINIT"
    ) {
      failures.push(".impeccable/design.json reset id is not current-goal scoped.");
    }

    if (designJson.shadcn?.style !== "base-nova") {
      failures.push(".impeccable/design.json does not record shadcn base-nova.");
    }

    if (designJson.shadcn?.iconLibrary !== "lucide") {
      failures.push(".impeccable/design.json does not record lucide icons.");
    }
  }

  if (componentsJson) {
    if (componentsJson.style !== "base-nova") {
      failures.push("apps/web/components.json does not use shadcn base-nova.");
    }

    if (componentsJson.iconLibrary !== "lucide") {
      failures.push("apps/web/components.json does not use lucide icons.");
    }

    if (componentsJson.aliases?.ui !== "@/components/ui") {
      failures.push("apps/web/components.json has an unexpected ui alias.");
    }
  }

  assertCountMatch({
    actualBlockedCount: blockedRows.length,
    actualRouteCount: browserVerifiedRows.length,
    description: "Checklist final reconciliation",
    pattern:
      /records\s+(\d+)\s+`Browser verified`\s+routes\s+and\s+(\d+)\s+`Blocked`\s+routes/u,
    source: checklist,
  });

  assertCountMatch({
    actualBlockedCount: blockedRows.length,
    actualRouteCount: browserVerifiedRows.length,
    description: "Review handoff",
    pattern:
      /Route table status:\s+(\d+)\s+browser-verified routes,\s+(\d+)\s+blocked routes/u,
    source: handoff,
  });

  assertCountMatch({
    actualBlockedCount: blockedRows.length,
    actualRouteCount: browserVerifiedRows.length,
    description: "Readiness audit",
    pattern:
      /records\s+(\d+)\s+browser-verified routes\s+and\s+(\d+)\s+route-level blockers/u,
    source: audit,
  });

  if (!audit.includes("operations_manager") || !audit.includes("diginoces_admin")) {
    failures.push("Readiness audit does not record dev QA role access.");
  }

  scanProductCopy();

  const designSystemFindings = runDesignSystemScan({ repoRoot });

  if (designSystemFindings.length > 0) {
    failures.push(
      `Design-system scan found blocked pattern(s):\n${designSystemFindings
        .map(
          (finding) =>
            `${finding.path}:${finding.line} [${finding.id}] ${finding.source}`,
        )
        .join("\n")}`,
    );
  }

  if (failures.length === 0) {
    console.log(
      `Redesign readiness evidence passed: ${routeRows.length} route rows, ${browserVerifiedRows.length} browser verified, ${blockedRows.length} blocked.`,
    );
  }
}

if (failures.length > 0) {
  console.error("Redesign readiness evidence failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
