import type { LoginAuthErrorCode } from "@/lib/auth/auth-service";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const shellCopy: Record<
  SupportedLanguage,
  {
    accountFallback: string;
    activityTrail: string;
    command: string;
    control: string;
    checkInbox: string;
    homeAria: string;
    languageLabel: string;
    operationsDashboard: string;
    partners: string;
    productTagline: string;
    reports: string;
    signIn: string;
    signOut: string;
    secureAccess: string;
    weddingOperations: string;
    weddingProjects: string;
    weddingProjectsCompact: string;
    workspace: string;
  }
> = {
  en: {
    accountFallback: "Workspace access",
    activityTrail: "Activity trail",
    command: "Command",
    control: "Control",
    checkInbox: "Check your inbox",
    homeAria: "Diginoces home",
    languageLabel: "Language",
    operationsDashboard: "Operations dashboard",
    partners: "Partners",
    productTagline: "Event guest management",
    reports: "Reports",
    signIn: "Sign in",
    signOut: "Sign out",
    secureAccess: "Secure access",
    weddingOperations: "Wedding operations",
    weddingProjects: "Wedding projects",
    weddingProjectsCompact: "Projects",
    workspace: "Workspace",
  },
  fr: {
    accountFallback: "Accès à l’espace",
    activityTrail: "Historique",
    command: "Pilotage",
    control: "Contrôle",
    checkInbox: "Vérifiez votre boîte mail",
    homeAria: "Accueil Diginoces",
    languageLabel: "Langue",
    operationsDashboard: "Tableau de bord",
    partners: "Partenaires",
    productTagline: "Gestion des invités",
    reports: "Rapports",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    secureAccess: "Accès sécurisé",
    weddingOperations: "Opérations de mariage",
    weddingProjects: "Mariages",
    weddingProjectsCompact: "Projets",
    workspace: "Espace de travail",
  },
};

export function getShellCopy(language: SupportedLanguage) {
  return shellCopy[language];
}

type LoginCopy = {
  activity: string;
  activityDescription: string;
  approvedEmailDescription: string;
  checkInbox: string;
  description: string;
  divider: string;
  emailAddress: string;
  emailPlaceholder: string;
  emailCode: string;
  emailLink: string;
  errorMessages: Record<LoginAuthErrorCode, string>;
  guests: string;
  guestsDescription: string;
  latestCodeDescription: string;
  payments: string;
  paymentsDescription: string;
  pendingSend: string;
  pendingVerify: string;
  rateLimitDescription: string;
  roleDescription: string;
  roleTitle: string;
  secureAccess: string;
  sendSignInLink: string;
  sentEmailPrefix: string;
  sentEmailSuffix: string;
  signInNeedsAttention: string;
  sixDigitCode: string;
  tokenPlaceholder: string;
  title: string;
  verifyEmailCode: string;
  weddingOperations: string;
  workspaceAccess: string;
  workspaceConnectionDescription: string;
  workspaceConnectionRequired: string;
  workspaceDescription: string;
};

const loginCopy: Record<SupportedLanguage, LoginCopy> = {
  en: {
    activity: "Activity",
    activityDescription: "Reviews and changes remain traceable.",
    approvedEmailDescription:
      "Use the email address approved for this workspace.",
    checkInbox: "Check your inbox",
    description:
      "Use your approved email address to open wedding projects, guest lists, RSVP, invitations, messages, seating, check-in, reports, files, and partner work.",
    divider: "or",
    emailAddress: "Email address",
    emailPlaceholder: "name@example.com",
    emailCode: "Email code",
    emailLink: "Email link",
    errorMessages: {
      AUTH_CODE_INVALID:
        "Authentication code is invalid or expired. Request a fresh email.",
      AUTH_EMAIL_CODE_REQUIRED: "Enter the 6-digit code from the email.",
      AUTH_EMAIL_INVALID: "Enter a valid email address.",
      AUTH_GENERIC_ERROR: "Unable to complete sign-in. Try again.",
      AUTH_LINK_INVALID:
        "Authentication link is invalid or expired. Request a fresh magic link.",
      AUTH_MAGIC_LINK_RATE_LIMITED:
        "Too many magic links requested. Wait a few minutes, then request a fresh link.",
      AUTH_MAGIC_LINK_REQUEST_FAILED: "Unable to request a magic link.",
      AUTH_WORKSPACE_NOT_CONFIGURED:
        "Ask an administrator to finish the workspace connection before requesting access links.",
    },
    guests: "Guests",
    guestsDescription: "Personal details stay permission limited.",
    latestCodeDescription: "Enter the latest code sent to your inbox.",
    payments: "Payments",
    paymentsDescription: "Commercial records require approved access.",
    pendingSend: "Sending...",
    pendingVerify: "Verifying...",
    rateLimitDescription:
      "Repeated requests may be rate limited. Use the newest email if you request more than one link or code.",
    roleDescription:
      "Sensitive areas may request another verification step before protected records are shown.",
    roleTitle: "Access stays role-aware",
    secureAccess: "Secure access",
    sendSignInLink: "Send sign-in link",
    sentEmailPrefix: "A sign-in link was requested for",
    sentEmailSuffix: ". Open the email to continue.",
    signInNeedsAttention: "Sign-in needs attention",
    sixDigitCode: "Six-digit code",
    tokenPlaceholder: "123456",
    title: "Sign in to the Diginoces workspace.",
    verifyEmailCode: "Verify email code",
    weddingOperations: "Wedding operations",
    workspaceAccess: "Workspace access",
    workspaceConnectionDescription:
      "Ask an administrator to finish the workspace connection before requesting access links.",
    workspaceConnectionRequired: "Workspace connection required",
    workspaceDescription:
      "Request a secure link or enter the six-digit code from your email.",
  },
  fr: {
    activity: "Activité",
    activityDescription: "Les revues et modifications restent traçables.",
    approvedEmailDescription:
      "Utilisez l’adresse e-mail approuvée pour cet espace.",
    checkInbox: "Vérifiez votre boîte mail",
    description:
      "Utilisez votre adresse e-mail approuvée pour ouvrir les mariages, listes d’invités, RSVP, invitations, messages, placement, accueil, rapports, fichiers et tâches partenaires.",
    divider: "ou",
    emailAddress: "Adresse e-mail",
    emailPlaceholder: "name@example.com",
    emailCode: "Code e-mail",
    emailLink: "Lien e-mail",
    errorMessages: {
      AUTH_CODE_INVALID:
        "Le code de connexion est invalide ou expiré. Demandez un nouvel e-mail.",
      AUTH_EMAIL_CODE_REQUIRED:
        "Saisissez le code à six chiffres reçu par e-mail.",
      AUTH_EMAIL_INVALID: "Saisissez une adresse e-mail valide.",
      AUTH_GENERIC_ERROR: "Impossible de terminer la connexion. Réessayez.",
      AUTH_LINK_INVALID:
        "Le lien de connexion est invalide ou expiré. Demandez un nouveau lien.",
      AUTH_MAGIC_LINK_RATE_LIMITED:
        "Trop de liens de connexion ont été demandés. Attendez quelques minutes, puis demandez un nouveau lien.",
      AUTH_MAGIC_LINK_REQUEST_FAILED:
        "Impossible de demander un lien de connexion.",
      AUTH_WORKSPACE_NOT_CONFIGURED:
        "Demandez à un administrateur de terminer la connexion de l’espace avant de demander des liens d’accès.",
    },
    guests: "Invités",
    guestsDescription:
      "Les informations personnelles restent limitées par permission.",
    latestCodeDescription:
      "Saisissez le dernier code envoyé dans votre boîte mail.",
    payments: "Paiements",
    paymentsDescription:
      "Les dossiers commerciaux demandent un accès approuvé.",
    pendingSend: "Envoi...",
    pendingVerify: "Vérification...",
    rateLimitDescription:
      "Les demandes répétées peuvent être limitées. Utilisez le dernier e-mail si vous demandez plus d’un lien ou code.",
    roleDescription:
      "Les zones sensibles peuvent demander une vérification supplémentaire avant d’afficher les dossiers protégés.",
    roleTitle: "L’accès reste limité par rôle",
    secureAccess: "Accès sécurisé",
    sendSignInLink: "Envoyer le lien de connexion",
    sentEmailPrefix: "Un lien de connexion a été demandé pour",
    sentEmailSuffix: ". Ouvrez l’e-mail pour continuer.",
    signInNeedsAttention: "La connexion demande une attention",
    sixDigitCode: "Code à six chiffres",
    tokenPlaceholder: "123456",
    title: "Connectez-vous à l’espace Diginoces.",
    verifyEmailCode: "Vérifier le code e-mail",
    weddingOperations: "Opérations de mariage",
    workspaceAccess: "Accès à l’espace",
    workspaceConnectionDescription:
      "Demandez à un administrateur de terminer la connexion de l’espace avant de demander des liens d’accès.",
    workspaceConnectionRequired: "Connexion de l’espace requise",
    workspaceDescription:
      "Demandez un lien sécurisé ou saisissez le code à six chiffres reçu par e-mail.",
  },
};

export function getLoginCopy(language: SupportedLanguage) {
  return loginCopy[language];
}
