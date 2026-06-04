import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type PublicEnvModule = {
  checkPublicVariable: (
    source: string,
    name: string,
    value: string,
    options?: {
      rejectUnsafePublicExamplePlaceholder?: boolean;
      violations?: string[];
    },
  ) => string[];
  containsRestrictedToken: (value: string) => boolean;
  discoverEnvFiles: (
    directory: string,
    relativePrefix?: string,
    currentDepth?: number,
    fileSystem?: typeof import("node:fs"),
    maxDepth?: number,
  ) => string[];
  hasPrivateKeyBlock: (value: string) => boolean;
  hasRestrictedPublicName: (name: string) => boolean;
  hasServiceRoleJwt: (value: string) => boolean;
  normalizeEnvValue: (value: string) => string;
  runPublicEnvCheck: (options?: {
    env?: Record<string, string>;
    logger?: {
      error: (message: string) => void;
      log: (message: string) => void;
    };
    repoRoot?: string;
  }) => { ok: boolean; violations: string[] };
  stripUnquotedInlineComment: (value: string) => string;
};

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

async function loadPublicEnvModule() {
  const scriptUrl = new URL(
    "../../../../../scripts/check-public-env-vars.mjs",
    import.meta.url,
  ).href;

  return (await import(/* @vite-ignore */ scriptUrl)) as PublicEnvModule;
}

function createServiceRoleJwt() {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({ role: "service_role" }),
  ).toString("base64url");

  return `${header}.${payload}.signature`;
}

function createTempRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), "diginoces-env-check-"));

  tempDirs.push(repoRoot);
  mkdirSync(join(repoRoot, "apps", "web"), { recursive: true });

  return repoRoot;
}

describe("public environment variable check", () => {
  it("detects restricted public variable names", async () => {
    const publicEnvModule = await loadPublicEnvModule();

    expect(
      publicEnvModule.hasRestrictedPublicName("NEXT_PUBLIC_API_SECRET"),
    ).toBe(true);
    expect(
      publicEnvModule.hasRestrictedPublicName("NEXT_PUBLIC_PRIVATE_KEY"),
    ).toBe(true);
    expect(
      publicEnvModule.hasRestrictedPublicName("NEXT_PUBLIC_SERVICE_ROLE_KEY"),
    ).toBe(true);
    expect(
      publicEnvModule.hasRestrictedPublicName(
        "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE",
      ),
    ).toBe(true);
    expect(
      publicEnvModule.hasRestrictedPublicName(
        "NEXT_PUBLIC_SIGNING_PRIVATE_KEY_PATH",
      ),
    ).toBe(true);
    expect(
      publicEnvModule.hasRestrictedPublicName("NEXT_PUBLIC_SUPABASE_URL"),
    ).toBe(false);
  });

  it("detects restricted service-role, private-key, and JWT values", async () => {
    const publicEnvModule = await loadPublicEnvModule();
    const serviceRoleJwt = createServiceRoleJwt();

    expect(
      publicEnvModule.containsRestrictedToken("sb_secret_abcdefghijklmnop"),
    ).toBe(true);
    expect(
      publicEnvModule.hasPrivateKeyBlock("-----BEGIN PRIVATE KEY-----"),
    ).toBe(true);
    expect(
      publicEnvModule.containsRestrictedToken('{"role":"service_role"}'),
    ).toBe(true);
    expect(
      publicEnvModule.containsRestrictedToken("{ 'role' : 'service_role' }"),
    ).toBe(true);
    expect(publicEnvModule.hasServiceRoleJwt(serviceRoleJwt)).toBe(true);
    expect(publicEnvModule.containsRestrictedToken(serviceRoleJwt)).toBe(true);
    expect(
      publicEnvModule.containsRestrictedToken("sb_publishable_safe_value"),
    ).toBe(false);
    expect(publicEnvModule.hasServiceRoleJwt("not.a-service-role.jwt")).toBe(
      false,
    );
  });

  it("handles quotes and inline comments conservatively", async () => {
    const publicEnvModule = await loadPublicEnvModule();

    expect(publicEnvModule.normalizeEnvValue('"safe value"')).toBe(
      "safe value",
    );
    expect(publicEnvModule.normalizeEnvValue('"unterminated')).toBe(
      '"unterminated',
    );
    expect(publicEnvModule.stripUnquotedInlineComment("safe # comment")).toBe(
      "safe",
    );
    expect(publicEnvModule.stripUnquotedInlineComment("safe\t# comment")).toBe(
      "safe",
    );
    expect(publicEnvModule.stripUnquotedInlineComment('"safe" # kept')).toBe(
      '"safe" # kept',
    );
  });

  it("aggregates public variable violations without flagging private names", async () => {
    const publicEnvModule = await loadPublicEnvModule();
    const violations: string[] = [];

    publicEnvModule.checkPublicVariable(
      "process.env",
      "PRIVATE_API_SECRET",
      "secret",
      {
        violations,
      },
    );
    publicEnvModule.checkPublicVariable(
      "process.env",
      "NEXT_PUBLIC_API_SECRET",
      "safe",
      { violations },
    );
    publicEnvModule.checkPublicVariable(
      ".env.example:1",
      "NEXT_PUBLIC_SUPABASE_URL",
      "change-me-now",
      { rejectUnsafePublicExamplePlaceholder: true, violations },
    );

    expect(violations).toEqual([
      "process.env: NEXT_PUBLIC_API_SECRET",
      ".env.example:1: NEXT_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("scans runtime env and discovered env files", async () => {
    const publicEnvModule = await loadPublicEnvModule();
    const repoRoot = createTempRepo();
    const logger = { error: vi.fn(), log: vi.fn() };

    writeFileSync(
      join(repoRoot, ".env.example"),
      "NEXT_PUBLIC_SUPABASE_URL=https://example.test\nNEXT_PUBLIC_BAD=replace-me-now\n",
    );
    writeFileSync(
      join(repoRoot, "apps", "web", ".env.local"),
      "NEXT_PUBLIC_SERVICE=sb_secret_abcdefghijklmnop\nPRIVATE_API_SECRET=service_role\n",
    );

    const result = publicEnvModule.runPublicEnvCheck({
      env: { NEXT_PUBLIC_RUNTIME: createServiceRoleJwt() },
      logger,
      repoRoot,
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      "process.env: NEXT_PUBLIC_RUNTIME",
      ".env.example:2: NEXT_PUBLIC_BAD",
      "apps/web/.env.local:1: NEXT_PUBLIC_SERVICE",
    ]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Public environment variable check failed"),
    );
  });

  it("lets callers constrain env file discovery depth", async () => {
    const publicEnvModule = await loadPublicEnvModule();
    const repoRoot = createTempRepo();

    mkdirSync(join(repoRoot, "a", "b", "c"), { recursive: true });
    writeFileSync(join(repoRoot, "a", ".env.local"), "NEXT_PUBLIC_A=safe\n");
    writeFileSync(
      join(repoRoot, "a", "b", "c", ".env.local"),
      "NEXT_PUBLIC_C=safe\n",
    );

    expect(
      publicEnvModule.discoverEnvFiles(repoRoot, "", 0, undefined, 2),
    ).toEqual(["a/.env.local"]);
    expect(
      publicEnvModule.discoverEnvFiles(repoRoot, "", 0, undefined, 4),
    ).toEqual(["a/.env.local", "a/b/c/.env.local"]);
  });
});
