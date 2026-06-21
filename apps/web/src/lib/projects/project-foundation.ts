import type { Database } from "@/types/database";

export type ProjectLifecycleStatus =
  Database["public"]["Enums"]["project_lifecycle_status"];
export type EventLifecycleStatus =
  Database["public"]["Enums"]["event_lifecycle_status"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type WorkflowTaskStatus =
  Database["public"]["Enums"]["workflow_task_status"];

export type StatusOption<T extends string> = {
  description: string;
  label: string;
  value: T;
};

export type WorkflowTaskTemplate = {
  requirementIds: string[];
  scope: "project" | "event";
  sortOrder: number;
  taskKey: string;
  title: string;
};

type ProjectDisplayFields = {
  bride_name: string;
  groom_name: string;
  project_code: string;
};

type EventDisplayFields = {
  event_code: string;
  name: string;
};

const internalProjectDisplayPattern =
  /\bmvp\b|\bsprint\b|\bfoundation\b|\bui qa\b|\bqa(?:\s+(?:demo|bride|groom|civil|reception|both|city|garden|csv|ui|import)|[_-])|\bqademo\b/i;

export const projectLifecycleOptions: StatusOption<ProjectLifecycleStatus>[] = [
  {
    description: "Potential client request or early internal setup.",
    label: "Lead",
    value: "lead",
  },
  {
    description: "Project is being prepared by Diginoces staff.",
    label: "Draft",
    value: "draft",
  },
  {
    description: "Project is ready for Diginoces review.",
    label: "Submitted",
    value: "submitted",
  },
  {
    description: "Diginoces has approved the project foundation.",
    label: "Approved",
    value: "approved",
  },
  {
    description: "Project is active for operational setup.",
    label: "Active",
    value: "active",
  },
  {
    description: "Data is being prepared for later invitation work.",
    label: "Ready for invitations",
    value: "ready_for_invitations",
  },
  {
    description: "Project is near or inside event operations.",
    label: "Event operations",
    value: "event_operations",
  },
  {
    description: "Diginoces has delivered the project service.",
    label: "Completed",
    value: "completed",
  },
  {
    description: "Project is retained but no longer active.",
    label: "Archived",
    value: "archived",
  },
];

export const eventLifecycleOptions: StatusOption<EventLifecycleStatus>[] = [
  {
    description: "Event details are being drafted.",
    label: "Draft",
    value: "draft",
  },
  {
    description: "Event date or operational setup is scheduled.",
    label: "Scheduled",
    value: "scheduled",
  },
  {
    description: "Event foundation is ready for downstream modules.",
    label: "Ready",
    value: "ready",
  },
  {
    description: "Event is currently in operational execution.",
    label: "In progress",
    value: "in_progress",
  },
  {
    description: "Event has been completed.",
    label: "Completed",
    value: "completed",
  },
  {
    description: "Event was cancelled.",
    label: "Cancelled",
    value: "cancelled",
  },
  {
    description: "Event is retained but inactive.",
    label: "Archived",
    value: "archived",
  },
];

export const eventTypeOptions: StatusOption<EventType>[] = [
  {
    description: "Civil ceremony.",
    label: "Civil",
    value: "civil",
  },
  {
    description: "Customary or traditional ceremony.",
    label: "Customary",
    value: "customary",
  },
  {
    description: "Religious ceremony.",
    label: "Religious",
    value: "religious",
  },
  {
    description: "Reception or party.",
    label: "Reception",
    value: "reception",
  },
  {
    description: "Brunch or related celebration.",
    label: "Brunch",
    value: "brunch",
  },
  {
    description: "Custom celebration type.",
    label: "Other",
    value: "other",
  },
];

export const defaultProjectWorkflowTasks: WorkflowTaskTemplate[] = [
  {
    requirementIds: ["PROJ-001", "PROJ-007"],
    scope: "project",
    sortOrder: 10,
    taskKey: "project.profile_review",
    title: "Review project profile",
  },
  {
    requirementIds: ["PROJ-002", "PROJ-007"],
    scope: "project",
    sortOrder: 20,
    taskKey: "project.event_plan",
    title: "Create initial event plan",
  },
  {
    requirementIds: ["ROLE-004", "PROJ-007"],
    scope: "project",
    sortOrder: 30,
    taskKey: "project.team_access",
    title: "Confirm project team access",
  },
];

export const defaultEventWorkflowTasks: WorkflowTaskTemplate[] = [
  {
    requirementIds: ["PROJ-002", "PROJ-007"],
    scope: "event",
    sortOrder: 10,
    taskKey: "event.details_review",
    title: "Review event details",
  },
  {
    requirementIds: ["ROLE-004", "PROJ-007"],
    scope: "event",
    sortOrder: 20,
    taskKey: "event.team_access",
    title: "Confirm event team access",
  },
];

export function getProjectLifecycleLabel(status: ProjectLifecycleStatus) {
  return (
    projectLifecycleOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export function getEventLifecycleLabel(status: EventLifecycleStatus) {
  return (
    eventLifecycleOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export function getEventTypeLabel(eventType: EventType) {
  return (
    eventTypeOptions.find((option) => option.value === eventType)?.label ??
    eventType
  );
}

export function isInternalProjectDisplayText(value: string) {
  return internalProjectDisplayPattern.test(value);
}

export function formatProjectCoupleDisplayName(
  project: Pick<ProjectDisplayFields, "bride_name" | "groom_name">,
  index: number,
) {
  const coupleName = `${project.bride_name} & ${project.groom_name}`;

  return isInternalProjectDisplayText(coupleName)
    ? `Wedding project ${index + 1}`
    : coupleName;
}

export function formatProjectDisplayReference(
  project: Pick<ProjectDisplayFields, "project_code">,
  index: number,
) {
  if (isInternalProjectDisplayText(project.project_code)) {
    return {
      isCode: false,
      label: "Project reference",
      value: `Project ${index + 1}`,
    };
  }

  return {
    isCode: true,
    label: "Project code",
    value: project.project_code,
  };
}

export function formatProjectContactDisplay(value: string | null | undefined) {
  if (!value || isInternalProjectDisplayText(value)) {
    return "Not set";
  }

  return value;
}

export function formatProjectEventDisplayName(
  event: Pick<EventDisplayFields, "name">,
  index: number,
) {
  return isInternalProjectDisplayText(event.name)
    ? `Event ${index + 1}`
    : event.name;
}

export function formatProjectEventDisplayReference(
  event: Pick<EventDisplayFields, "event_code">,
  index: number,
) {
  if (isInternalProjectDisplayText(event.event_code)) {
    return {
      isCode: false,
      label: "Event reference",
      value: `Event ${index + 1}`,
    };
  }

  return {
    isCode: true,
    label: "Event code",
    value: event.event_code,
  };
}

export function formatProjectVenueDisplay(value: string | null | undefined) {
  if (!value || isInternalProjectDisplayText(value)) {
    return "Venue not set";
  }

  return value;
}

export function getSprint2FoundationStatus() {
  return {
    epic: "EPIC-PROJ",
    features: ["FEAT-PROJ-001", "FEAT-PROJ-002", "FEAT-PROJ-003"],
    issue: 3,
    modules: [
      {
        description:
          "Wedding project records with lifecycle status and generated readable codes.",
        name: "Project model",
        requirementIds: ["PROJ-001", "PROJ-003"],
      },
      {
        description:
          "Event records scoped to one project with generated and editable event codes.",
        name: "Event model",
        requirementIds: ["PROJ-002", "PROJ-004"],
      },
      {
        description:
          "Project and event member tables tied back to Sprint 1 roles and permissions.",
        name: "Membership foundation",
        requirementIds: ["ROLE-004", "PROJ-001", "PROJ-002"],
      },
      {
        description:
          "Generated project and event checklist tasks for setup tracking only.",
        name: "Workflow checklist foundation",
        requirementIds: ["PROJ-007"],
      },
    ],
    sprint: "Sprint 2 - Wedding Projects & Events Foundation",
  };
}
