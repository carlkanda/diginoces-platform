export type FoundationModule = {
  description: string;
  name: string;
  requirementIds: string[];
};

export type PlatformEntryActionVisibilityInput = {
  canManageAccess?: boolean;
  canOpenPartnerDashboard: boolean;
  canReadGlobalDashboard: boolean;
  canReadReports: boolean;
};

export function getPlatformEntryActionVisibility({
  canManageAccess = false,
  canOpenPartnerDashboard,
  canReadGlobalDashboard,
  canReadReports,
}: PlatformEntryActionVisibilityInput) {
  return {
    showAccessControl: canManageAccess,
    showGlobalDashboard: canReadGlobalDashboard,
    showPartnerDashboard: canOpenPartnerDashboard,
    showPartners: true,
    showProjects: true,
    showReports: canReadReports,
  };
}

export function getPlatformFoundationStatus() {
  const modules: FoundationModule[] = [
    {
      description:
        "Next.js App Router shell with TypeScript and workspace scripts.",
      name: "Web app scaffold",
      requirementIds: ["TECH-001", "TECH-003"],
    },
    {
      description:
        "Supabase SSR clients, email-code sign-in action, callback route, and proxy token refresh.",
      name: "Authentication foundation",
      requirementIds: ["PV-001", "PV-002", "ROLE-001"],
    },
    {
      description:
        "Typed global, project, event, and custom role definitions with MFA markers.",
      name: "Role and permission foundation",
      requirementIds: ["ROLE-001", "ROLE-002", "ROLE-003", "ROLE-007"],
    },
    {
      description:
        "Append-only audit model and writer interface for sensitive backend actions.",
      name: "Audit-log foundation",
      requirementIds: ["REP-006", "ROLE-007"],
    },
    {
      description:
        "Fail-closed app-owned storage adapter placeholder and file registry model.",
      name: "File-storage foundation",
      requirementIds: ["FILE-001", "TECH-004"],
    },
  ];

  return {
    issue: 1,
    modules,
    requirementIds: Array.from(
      new Set(modules.flatMap((module) => module.requirementIds)),
    ).sort(),
    sprint: "Sprint 1 - Secure Platform Foundation",
  };
}
