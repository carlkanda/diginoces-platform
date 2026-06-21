import type { SupportedLanguage } from "@/lib/i18n/config";

export const homeCopy: Record<
  SupportedLanguage,
  {
    audience: {
      body: string;
      items: {
        body: string;
        id: "couples" | "operations" | "partners";
        title: string;
      }[];
      title: string;
    };
    footerNote: string;
    header: {
      discover: string;
      languageLabel: string;
      localPreview: string;
      publicNavigationLabel: string;
      signIn: string;
      tagline: string;
    };
    hero: {
      alt: string;
      badge: string;
      body: string;
      primaryAction: string;
      secondaryAction: string;
      title: string;
      trust: string;
    };
    principles: {
      body: string;
      items: {
        body: string;
        id: "bilingual" | "less-noise" | "protected";
        title: string;
      }[];
      title: string;
    };
  }
> = {
  en: {
    audience: {
      body: "The public page should make the product feel trustworthy before anyone signs in. The workspace stays detailed only after a user enters the protected app.",
      items: [
        {
          body: "A simple place to understand where the wedding stands and what needs attention.",
          id: "couples",
          title: "For couples",
        },
        {
          body: "Clear handoffs for guest lists, RSVP, invitations, messages, seating, and arrival.",
          id: "operations",
          title: "For operations",
        },
        {
          body: "Narrow, permission-aware work areas that keep partner tasks separate from private records.",
          id: "partners",
          title: "For partners",
        },
      ],
      title: "Built for people who need calm, not complexity.",
    },
    footerNote:
      "Production access stays protected by Diginoces roles, MFA-sensitive controls, and server-side checks.",
    header: {
      discover: "Discover",
      languageLabel: "Language",
      localPreview: "Secure local preview",
      publicNavigationLabel: "Public navigation",
      signIn: "Sign in",
      tagline: "Guest management for weddings",
    },
    hero: {
      alt: "A premium event operations desk with guest-list screens, invitation cards, seating materials, and a messaging phone.",
      badge: "Wedding guest operations",
      body: "Diginoces brings guest lists, RSVPs, invitations, WhatsApp preparation, seating, check-in, files, and reports into one calm workspace for weddings and event teams.",
      primaryAction: "Enter workspace",
      secondaryAction: "View weddings",
      title: "Diginoces",
      trust: "French and English by design. Sensitive records stay role-aware.",
    },
    principles: {
      body: "The experience now separates public confidence from protected daily work: visitors see the promise; signed-in users see only the next useful action.",
      items: [
        {
          body: "The interface opens with one recommended path, then reveals details only when they help the current task.",
          id: "less-noise",
          title: "Less visible noise",
        },
        {
          body: "French is the default, English remains one click away, and long labels are allowed to breathe.",
          id: "bilingual",
          title: "Bilingual from the shell",
        },
        {
          body: "Guest data, payments, files, and audit records remain behind existing permission checks.",
          id: "protected",
          title: "Protected by design",
        },
      ],
      title: "A public promise, then a focused workspace.",
    },
  },
  fr: {
    audience: {
      body: "La page publique doit inspirer confiance avant la connexion. Les détails opérationnels restent dans l’application protégée, là où ils sont utiles.",
      items: [
        {
          body: "Un espace simple pour comprendre l’état du mariage et ce qui demande une attention.",
          id: "couples",
          title: "Pour les couples",
        },
        {
          body: "Des passages clairs entre liste d’invités, RSVP, invitations, messages, placement et accueil.",
          id: "operations",
          title: "Pour les équipes",
        },
        {
          body: "Des espaces limités par rôle, pour collaborer sans exposer les dossiers privés.",
          id: "partners",
          title: "Pour les partenaires",
        },
      ],
      title:
        "Pensé pour les personnes qui veulent du calme, pas de la complexité.",
    },
    footerNote:
      "L’accès de production reste protégé par les rôles Diginoces, les contrôles sensibles à la MFA et les vérifications côté serveur.",
    header: {
      discover: "Découvrir",
      languageLabel: "Langue",
      localPreview: "Aperçu local sécurisé",
      publicNavigationLabel: "Navigation publique",
      signIn: "Se connecter",
      tagline: "Gestion des invités de mariage",
    },
    hero: {
      alt: "Un bureau haut de gamme d’opérations événementielles avec écrans de liste d’invités, cartons d’invitation, plan de table et téléphone de messagerie.",
      badge: "Opérations invités de mariage",
      body: "Diginoces réunit listes d’invités, RSVP, invitations, préparation WhatsApp, placement, accueil, fichiers et rapports dans un espace calme pour les mariages et les équipes événementielles.",
      primaryAction: "Entrer dans l’espace",
      secondaryAction: "Voir les mariages",
      title: "Diginoces",
      trust:
        "Français et anglais dès le départ. Les dossiers sensibles restent limités par rôle.",
    },
    principles: {
      body: "L’expérience sépare désormais la promesse publique du travail quotidien protégé : les visiteurs voient la valeur, les utilisateurs connectés voient seulement l’action utile.",
      items: [
        {
          body: "L’interface commence par un chemin recommandé, puis révèle les détails au moment où ils aident vraiment.",
          id: "less-noise",
          title: "Moins de bruit visible",
        },
        {
          body: "Le français est la langue principale, l’anglais reste accessible en un clic, et les libellés longs respirent.",
          id: "bilingual",
          title: "Bilingue dès l’enveloppe",
        },
        {
          body: "Invités, paiements, fichiers et historiques restent derrière les contrôles d’accès existants.",
          id: "protected",
          title: "Protégé par conception",
        },
      ],
      title: "Une promesse publique, puis un espace de travail concentré.",
    },
  },
};

export function getHomeCopy(language: SupportedLanguage) {
  return homeCopy[language];
}
