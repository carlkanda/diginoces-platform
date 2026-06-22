import type { SupportedLanguage } from "@/lib/i18n/config";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type WorkspaceCommandIcon =
  | "activity"
  | "bar-chart"
  | "book-open"
  | "building"
  | "calendar"
  | "check-in"
  | "clipboard"
  | "credit-card"
  | "file"
  | "folder"
  | "home"
  | "layout"
  | "mail"
  | "message"
  | "qr"
  | "table"
  | "upload"
  | "users";

export type WorkspaceCommandItem = {
  badge?: string;
  description: string;
  href: string;
  icon: WorkspaceCommandIcon;
  keywords: string[];
  label: string;
};

export type WorkspaceCommandGroup = {
  items: WorkspaceCommandItem[];
  label: string;
};

export type WorkspaceRouteContext = {
  eventId?: string;
  projectId?: string;
};

type WorkspaceCommandCopy = {
  groups: {
    control: string;
    event: string;
    project: string;
    workspace: string;
  };
  items: Record<
    | "activity"
    | "addGuest"
    | "checkIn"
    | "commercial"
    | "eventDashboard"
    | "eventFiles"
    | "eventOverview"
    | "feedback"
    | "files"
    | "guestBook"
    | "guestImports"
    | "guestList"
    | "invitationDesigns"
    | "messages"
    | "messageTemplates"
    | "operationsDashboard"
    | "partnerDashboard"
    | "partners"
    | "projectOverview"
    | "projects"
    | "reports"
    | "rsvp"
    | "scan"
    | "seating"
    | "seatingMap"
    | "workspace",
    {
      description: string;
      keywords: string[];
      label: string;
    }
  >;
};

const commandCopy: Record<SupportedLanguage, WorkspaceCommandCopy> = {
  en: {
    groups: {
      control: "Control and evidence",
      event: "This event",
      project: "This wedding",
      workspace: "Workspace",
    },
    items: {
      activity: {
        description: "Review traceable activity across sensitive work.",
        keywords: ["audit", "activity", "history", "evidence"],
        label: "Activity trail",
      },
      addGuest: {
        description: "Create a guest manually when an import is not needed.",
        keywords: ["guest", "create", "manual", "person"],
        label: "Add guest",
      },
      checkIn: {
        description: "Open the arrival desk for event-day check-in.",
        keywords: ["check-in", "arrival", "event day", "desk"],
        label: "Check-in desk",
      },
      commercial: {
        description: "Review contract, balance, and payment-gate controls.",
        keywords: ["commercial", "contract", "balance", "payment"],
        label: "Commercial controls",
      },
      eventDashboard: {
        description: "Read event-level operations signals.",
        keywords: ["event", "dashboard", "signals", "readiness"],
        label: "Event dashboard",
      },
      eventFiles: {
        description: "Open files attached to this event.",
        keywords: ["event", "files", "documents", "download"],
        label: "Event files",
      },
      eventOverview: {
        description: "Return to this event's main workspace.",
        keywords: ["event", "overview", "details"],
        label: "Event overview",
      },
      feedback: {
        description: "Review post-event feedback and testimonial decisions.",
        keywords: ["feedback", "testimonial", "review"],
        label: "Feedback review",
      },
      files: {
        description: "Manage permission-aware wedding files.",
        keywords: ["files", "documents", "storage", "download"],
        label: "Wedding files",
      },
      guestBook: {
        description: "Review keepsake messages before they are shared.",
        keywords: ["guest book", "keepsake", "messages", "review"],
        label: "Guest book",
      },
      guestImports: {
        description: "Upload, map, validate, and review guest CSV imports.",
        keywords: ["guest", "import", "csv", "review"],
        label: "Guest imports",
      },
      guestList: {
        description: "Open the guest list with side and event filters.",
        keywords: ["guests", "list", "side", "event"],
        label: "Guest list",
      },
      invitationDesigns: {
        description: "Configure invitation templates and generation results.",
        keywords: ["invitation", "pdf", "template", "design"],
        label: "Invitation designs",
      },
      messages: {
        description: "Prepare manual WhatsApp message queues and history.",
        keywords: ["message", "whatsapp", "queue", "history"],
        label: "Message queue",
      },
      messageTemplates: {
        description: "Maintain bilingual message templates.",
        keywords: ["message", "template", "french", "english"],
        label: "Message templates",
      },
      operationsDashboard: {
        description: "Scan global wedding operations and active work.",
        keywords: ["dashboard", "operations", "signals"],
        label: "Operations dashboard",
      },
      partnerDashboard: {
        description: "Open the partner workspace when your role allows it.",
        keywords: ["partner", "workspace", "submissions"],
        label: "Partner workspace",
      },
      partners: {
        description: "Manage partner profiles and project submissions.",
        keywords: ["partners", "profiles", "submissions"],
        label: "Partners",
      },
      projectOverview: {
        description: "Return to this wedding's main workspace.",
        keywords: ["wedding", "project", "overview"],
        label: "Wedding overview",
      },
      projects: {
        description: "Find or create wedding workspaces.",
        keywords: ["weddings", "projects", "clients"],
        label: "Wedding projects",
      },
      reports: {
        description: "Open authorized reports and exports.",
        keywords: ["reports", "exports", "analytics"],
        label: "Reports",
      },
      rsvp: {
        description: "Review responses, deadlines, and operational effects.",
        keywords: ["rsvp", "responses", "deadline"],
        label: "RSVP overview",
      },
      scan: {
        description: "Open the QR check-in scanner workflow.",
        keywords: ["qr", "scan", "check-in"],
        label: "Scan QR",
      },
      seating: {
        description: "Manage table plans and guest assignments.",
        keywords: ["seating", "tables", "assignments"],
        label: "Table plan",
      },
      seatingMap: {
        description: "Review the visual seating map for event handoff.",
        keywords: ["seating", "map", "room", "handoff"],
        label: "Seating map",
      },
      workspace: {
        description: "Return to the main workspace launchpad.",
        keywords: ["home", "workspace", "start"],
        label: "Workspace",
      },
    },
  },
  fr: {
    groups: {
      control: "Contrôle et preuves",
      event: "Cet événement",
      project: "Ce mariage",
      workspace: "Espace de travail",
    },
    items: {
      activity: {
        description: "Consulter les activités traçables des zones sensibles.",
        keywords: ["audit", "activité", "historique", "preuve"],
        label: "Historique",
      },
      addGuest: {
        description:
          "Créer un invité manuellement quand l'import n'est pas nécessaire.",
        keywords: ["invité", "créer", "manuel", "personne"],
        label: "Ajouter un invité",
      },
      checkIn: {
        description: "Ouvrir l'accueil des invités le jour de l'événement.",
        keywords: ["accueil", "arrivée", "jour j", "contrôle"],
        label: "Accueil",
      },
      commercial: {
        description: "Revoir contrat, solde et contrôles d'accès invité.",
        keywords: ["commercial", "contrat", "solde", "paiement"],
        label: "Contrôle commercial",
      },
      eventDashboard: {
        description: "Lire les signaux opérationnels de cet événement.",
        keywords: ["événement", "tableau", "signaux", "préparation"],
        label: "Tableau événement",
      },
      eventFiles: {
        description: "Ouvrir les fichiers rattachés à cet événement.",
        keywords: ["événement", "fichiers", "documents"],
        label: "Fichiers événement",
      },
      eventOverview: {
        description: "Revenir à l'espace principal de cet événement.",
        keywords: ["événement", "aperçu", "détails"],
        label: "Vue événement",
      },
      feedback: {
        description: "Revoir les retours et décisions de témoignage.",
        keywords: ["retour", "témoignage", "revue"],
        label: "Retours",
      },
      files: {
        description: "Gérer les fichiers du mariage selon les permissions.",
        keywords: ["fichiers", "documents", "stockage"],
        label: "Fichiers mariage",
      },
      guestBook: {
        description: "Revoir les messages souvenirs avant partage.",
        keywords: ["livre", "souvenir", "messages", "revue"],
        label: "Livre d'or",
      },
      guestImports: {
        description: "Importer, mapper, valider et revoir les CSV invités.",
        keywords: ["invité", "import", "csv", "revue"],
        label: "Imports invités",
      },
      guestList: {
        description: "Ouvrir la liste d'invités avec filtres côté/événement.",
        keywords: ["invités", "liste", "côté", "événement"],
        label: "Liste d'invités",
      },
      invitationDesigns: {
        description:
          "Configurer les modèles d'invitation et les résultats générés.",
        keywords: ["invitation", "pdf", "modèle", "design"],
        label: "Invitations",
      },
      messages: {
        description:
          "Préparer les files de messages WhatsApp manuels et l'historique.",
        keywords: ["message", "whatsapp", "file", "historique"],
        label: "File de messages",
      },
      messageTemplates: {
        description: "Maintenir les modèles de messages bilingues.",
        keywords: ["message", "modèle", "français", "anglais"],
        label: "Modèles de messages",
      },
      operationsDashboard: {
        description: "Parcourir les signaux opérationnels des mariages.",
        keywords: ["tableau", "opérations", "signaux"],
        label: "Tableau de bord",
      },
      partnerDashboard: {
        description: "Ouvrir l'espace partenaire quand votre rôle l'autorise.",
        keywords: ["partenaire", "espace", "soumissions"],
        label: "Espace partenaire",
      },
      partners: {
        description: "Gérer les profils partenaires et leurs soumissions.",
        keywords: ["partenaires", "profils", "soumissions"],
        label: "Partenaires",
      },
      projectOverview: {
        description: "Revenir à l'espace principal de ce mariage.",
        keywords: ["mariage", "projet", "aperçu"],
        label: "Vue mariage",
      },
      projects: {
        description: "Trouver ou créer les espaces mariage.",
        keywords: ["mariages", "projets", "clients"],
        label: "Mariages",
      },
      reports: {
        description: "Ouvrir les rapports et exports autorisés.",
        keywords: ["rapports", "exports", "analyse"],
        label: "Rapports",
      },
      rsvp: {
        description: "Revoir les réponses, échéances et effets opérationnels.",
        keywords: ["rsvp", "réponses", "échéance"],
        label: "RSVP",
      },
      scan: {
        description: "Ouvrir le flux de scan QR pour l'accueil.",
        keywords: ["qr", "scan", "accueil"],
        label: "Scanner QR",
      },
      seating: {
        description: "Gérer les tables et affectations d'invités.",
        keywords: ["placement", "tables", "affectations"],
        label: "Plan de table",
      },
      seatingMap: {
        description: "Revoir le plan visuel pour le passage en événement.",
        keywords: ["placement", "plan", "salle", "passage"],
        label: "Plan de salle",
      },
      workspace: {
        description: "Revenir au point d'entrée principal.",
        keywords: ["accueil", "espace", "départ"],
        label: "Espace de travail",
      },
    },
  },
};

function isUuid(value: string | undefined) {
  return Boolean(value && uuidPattern.test(value));
}

function normalizePathname(pathname: string) {
  const [path] = pathname.split(/[?#]/u);

  return path || "/";
}

function getSegmentAfter(pathname: string, segmentName: string) {
  const segments = normalizePathname(pathname)
    .split("/")
    .filter((segment) => segment.length > 0);
  const index = segments.indexOf(segmentName);

  return index >= 0 ? segments[index + 1] : undefined;
}

export function getWorkspaceRouteContext(
  pathname: string,
): WorkspaceRouteContext {
  const projectId = getSegmentAfter(pathname, "projects");
  const eventId = getSegmentAfter(pathname, "events");

  return {
    eventId: isUuid(eventId) ? eventId : undefined,
    projectId: isUuid(projectId) ? projectId : undefined,
  };
}

function item(
  copy: WorkspaceCommandCopy,
  key: keyof WorkspaceCommandCopy["items"],
  href: string,
  icon: WorkspaceCommandIcon,
  badge?: string,
): WorkspaceCommandItem {
  const source = copy.items[key];

  return {
    badge,
    description: source.description,
    href,
    icon,
    keywords: source.keywords,
    label: source.label,
  };
}

export function getWorkspaceCommandGroups({
  context = {},
  language,
}: {
  context?: WorkspaceRouteContext;
  language: SupportedLanguage;
}): WorkspaceCommandGroup[] {
  const copy = commandCopy[language];
  const groups: WorkspaceCommandGroup[] = [
    {
      items: [
        item(copy, "workspace", "/platform", "home"),
        item(copy, "projects", "/platform/projects", "folder"),
        item(copy, "operationsDashboard", "/platform/dashboard", "layout"),
        item(copy, "reports", "/platform/reports", "bar-chart"),
      ],
      label: copy.groups.workspace,
    },
  ];

  if (context.projectId) {
    const base = `/platform/projects/${context.projectId}`;

    groups.push({
      items: [
        item(copy, "projectOverview", base, "folder"),
        item(copy, "guestList", `${base}/guests`, "users"),
        item(copy, "addGuest", `${base}/guests/new`, "users"),
        item(copy, "guestImports", `${base}/guest-imports`, "upload"),
        item(copy, "rsvp", `${base}/rsvps`, "clipboard"),
        item(copy, "messages", `${base}/communications`, "message"),
        item(
          copy,
          "messageTemplates",
          `${base}/communications/templates`,
          "mail",
        ),
        item(copy, "files", `${base}/files`, "file"),
        item(copy, "guestBook", `${base}/guest-book`, "book-open"),
        item(copy, "feedback", `${base}/feedback`, "clipboard"),
        item(copy, "commercial", `${base}/commercial`, "credit-card"),
      ],
      label: copy.groups.project,
    });
  }

  if (context.eventId) {
    const base = `/platform/events/${context.eventId}`;

    groups.push({
      items: [
        item(copy, "eventOverview", base, "calendar"),
        item(copy, "eventDashboard", `${base}/dashboard`, "layout"),
        item(copy, "invitationDesigns", `${base}/invitations`, "mail"),
        item(copy, "seating", `${base}/seating`, "table"),
        item(copy, "seatingMap", `${base}/seating/map`, "table"),
        item(copy, "checkIn", `${base}/check-in`, "check-in"),
        item(copy, "scan", `${base}/check-in/scan`, "qr"),
        item(copy, "eventFiles", `${base}/files`, "file"),
      ],
      label: copy.groups.event,
    });
  }

  groups.push({
    items: [
      item(copy, "activity", "/platform/audit-logs", "activity"),
      item(copy, "partners", "/platform/partners", "building"),
      item(copy, "partnerDashboard", "/platform/partner-dashboard", "building"),
    ],
    label: copy.groups.control,
  });

  return groups;
}
