import { DEFAULT_LANGUAGE, type SupportedLanguage } from "@/lib/i18n/config";

const exactEnglishToFrench = {
  "Access setup needed": "Configuration d’accès requise",
  "Access stays role-aware": "L’accès reste limité par rôle",
  Account: "Compte",
  Action: "Action",
  Active: "Actif",
  Activity: "Activité",
  "Activity trail": "Historique",
  "Add guest": "Ajouter un invité",
  "Add one guest": "Ajouter un invité manuellement",
  "All events": "Tous les événements",
  "All sides": "Tous les côtés",
  "Ask an administrator to finish the workspace connection before requesting access links.":
    "Demandez à un administrateur de terminer la connexion de l’espace avant de demander des liens d’accès.",
  "Approved roles": "Rôles approuvés",
  "Back to projects": "Retour aux mariages",
  "Back to workspace": "Retour à l’espace",
  "Best next step": "Meilleure prochaine étape",
  "Bride side": "Côté mariée",
  "Both sides": "Deux côtés",
  "Check your inbox": "Vérifiez votre boîte mail",
  "Check-in": "Accueil",
  "Clear ownership": "Responsabilités claires",
  Command: "Pilotage",
  "Commercial work": "Commercial",
  "Communication state": "État des messages",
  Communications: "Communications",
  Contact: "Contact",
  Continue: "Continuer",
  Control: "Contrôle",
  "Controlled access": "Accès contrôlé",
  "Control and evidence": "Contrôle et preuves",
  "Couple view": "Vue couple",
  "CSV imports": "Imports CSV",
  "CSV only": "CSV uniquement",
  "Current access": "Accès actuel",
  "Current focus": "Priorité actuelle",
  Dashboard: "Tableau de bord",
  Date: "Date",
  Delivered: "Livré",
  Digital: "Numérique",
  "Digital invitation": "Invitation numérique",
  "Diginoces home": "Accueil Diginoces",
  "Diginoces workspace": "Espace Diginoces",
  Draft: "Brouillon",
  "Email address": "Adresse e-mail",
  "Email code": "Code e-mail",
  "Email link": "Lien e-mail",
  English: "Anglais",
  "Enter workspace": "Entrer dans l’espace",
  Event: "Événement",
  "Event dashboard": "Tableau événement",
  "Event day": "Jour de l’événement",
  "Event files": "Fichiers événement",
  "Event guest management": "Gestion des invités",
  "Event overview": "Vue événement",
  Events: "Événements",
  Files: "Fichiers",
  "Find a wedding": "Trouver un mariage",
  "Find the right wedding, event, guest, invitation, message, report, or control area without learning the whole navigation first.":
    "Trouvez le bon mariage, événement, invité, invitation, message, rapport ou contrôle sans connaître toute la navigation.",
  French: "Français",
  Guest: "Invité",
  "Guest actions": "Actions invité",
  "Guest book": "Livre d’or",
  "Guest imports": "Imports invités",
  "Guest list": "Liste d’invités",
  Guests: "Invités",
  "Groom side": "Côté marié",
  Help: "Aide",
  "Import history": "Historique des imports",
  Imports: "Imports",
  "Invitation work can begin": "Les invitations peuvent commencer",
  Invitations: "Invitations",
  Language: "Langue",
  "Language not set": "Langue non définie",
  "Latest movement": "Dernière activité",
  "Manual WhatsApp workflow": "Flux WhatsApp manuel",
  Messages: "Messages",
  "No guests match this view": "Aucun invité ne correspond à cette vue",
  "No imports yet": "Aucun import pour le moment",
  "No matching workspace area": "Aucune zone trouvée",
  "No messages waiting": "Aucun message en attente",
  "No review queue": "Aucune file de revue",
  "No workspace areas yet": "Aucun espace disponible",
  Open: "Ouvrir",
  "Open a wedding": "Ouvrez un mariage",
  "Open dashboard": "Ouvrir le tableau de bord",
  "Open guest list": "Ouvrir la liste d’invités",
  "Open partner dashboard": "Ouvrir l’espace partenaire",
  "Open project": "Ouvrir le projet",
  "Open queue": "Ouvrir la file",
  "Open wedding projects": "Ouvrir les mariages",
  "Open workspace": "Ouvrir l’espace",
  "Operations dashboard": "Tableau des opérations",
  "Operations view": "Vue opérations",
  Operational: "Opérationnel",
  "Partner workspace": "Espace partenaire",
  Partners: "Partenaires",
  Payments: "Paiements",
  "Printed invitation": "Invitation imprimée",
  "Printed only": "Imprimé seulement",
  Project: "Projet",
  "Project channel": "Canal projet",
  "Project comments": "Commentaires du projet",
  "Project dashboard": "Tableau du projet",
  "Project overview": "Vue du projet",
  "Protected actions": "Actions protégées",
  "Protected area": "Zone protégée",
  Ready: "Prêt",
  "Ready for daily work": "Prêt pour le travail quotidien",
  "Ready for review": "Prêt pour revue",
  Reports: "Rapports",
  "Review reports": "Consulter les rapports",
  "Review before apply": "Revoir avant d’ajouter",
  Role: "Rôle",
  "Role-aware navigation": "Navigation par rôle",
  RSVP: "RSVP",
  Seating: "Placement",
  "Seating map": "Plan de salle",
  "Secure access": "Accès sécurisé",
  "Search Diginoces": "Rechercher dans Diginoces",
  "Search workspace": "Rechercher",
  "Search wedding operations...": "Rechercher dans les opérations...",
  "Send sign-in link": "Envoyer le lien de connexion",
  "Sending...": "Envoi...",
  "Sign in": "Se connecter",
  "Sign in to the Diginoces workspace.": "Connectez-vous à l’espace Diginoces.",
  "Sign-in needs attention": "La connexion demande une attention",
  "Sign out": "Se déconnecter",
  "Signed in as": "Connecté en tant que",
  "Six-digit code": "Code à six chiffres",
  Status: "Statut",
  "Suggested next step": "Prochaine étape suggérée",
  "Team access": "Accès équipe",
  "This event": "Cet événement",
  "This wedding": "Ce mariage",
  "Traceable decisions": "Décisions traçables",
  "Upload CSV": "Importer un CSV",
  Venue: "Lieu",
  "Verify email code": "Vérifier le code e-mail",
  "Verifying...": "Vérification...",
  Wedding: "Mariage",
  "Wedding operating map": "Carte de travail du mariage",
  "Wedding operations": "Opérations de mariage",
  "Wedding project desk": "Bureau des mariages",
  "Wedding projects": "Projets de mariage",
  "Wedding record": "Dossier mariage",
  "Wedding records": "Dossiers mariage",
  "Wedding workstreams": "Flux de travail mariage",
  Weddings: "Mariages",
  "WhatsApp sending stays manual": "L’envoi WhatsApp reste manuel",
  Workspace: "Espace de travail",
  "Workspace access": "Accès à l’espace",
  "Workspace connection required": "Connexion de l’espace requise",
  "Workspace connection pending": "Connexion de l’espace en attente",
  "Workspace ready": "Espace prêt",
  "Your wedding projects": "Vos mariages",
  "Request a secure link or enter the six-digit code from your email.":
    "Demandez un lien sécurisé ou saisissez le code à six chiffres reçu par e-mail.",
  "Use your approved email address to open wedding projects, guest lists, RSVP, invitations, messages, seating, check-in, reports, files, and partner work.":
    "Utilisez votre adresse e-mail approuvée pour ouvrir les mariages, listes d’invités, RSVP, invitations, messages, placement, accueil, rapports, fichiers et tâches partenaires.",
  "Repeated requests may be rate limited. Use the newest email if you request more than one link or code.":
    "Les demandes répétées peuvent être limitées. Utilisez le dernier e-mail si vous demandez plus d’un lien ou code.",
  "Start with the records most teams need first. Available actions still depend on your role.":
    "Commencez par les dossiers dont la plupart des équipes ont besoin. Les actions disponibles dépendent toujours de votre rôle.",
  "This compact view shows wording readiness, prepared messages, and work waiting for a manual send.":
    "Cette vue compacte montre l’état des textes, les messages préparés et le travail en attente d’un envoi manuel.",
  "Use this queue to see what needs attention before the team records a final sending result.":
    "Utilisez cette file pour voir ce qui demande une attention avant que l’équipe enregistre le résultat final.",
  "Open nearby workflows without losing the current project.":
    "Ouvrez les flux proches sans perdre le mariage en cours.",
  "Open quick navigation with Ctrl or Command plus K":
    "Ouvrir la navigation rapide avec Ctrl ou Commande plus K",
  "Search opens the destination; sensitive records still follow your role, MFA, and project access.":
    "La recherche ouvre la destination ; les dossiers sensibles restent limités par votre rôle, MFA et accès projet.",
  "Try a workflow word such as guests, RSVP, imports, invitations, messages, seating, check-in, reports, or partners.":
    "Essayez un mot de travail comme invités, RSVP, imports, invitations, messages, placement, accueil, rapports ou partenaires.",
  "You only see weddings connected to this account. Open one to continue inside its project workspace.":
    "Vous voyez seulement les mariages liés à ce compte. Ouvrez-en un pour continuer dans son espace de travail.",
} as const;

/**
 * Ordered phrase replacements applied after exact matches fail.
 * If a new phrase is a substring of another phrase, keep the longer phrase
 * first so sequential replaceAll calls do not break the longer translation.
 */
const phraseEnglishToFrench = [
  [
    "Start the wedding operation from one accountable place.",
    "Lancez l’opération du mariage depuis un seul espace responsable.",
  ],
  [
    "Open a wedding workspace, then move into events, guests, invitations, messages, seating, files, and event-day work.",
    "Ouvrez un espace mariage, puis avancez vers les événements, invités, invitations, messages, plans de table, fichiers et opérations du jour J.",
  ],
  ["Open wedding projects", "Ouvrir les mariages"],
  ["Open guest list", "Ouvrir la liste d’invités"],
  ["Open dashboard", "Ouvrir le tableau de bord"],
  ["Open project", "Ouvrir le projet"],
  ["Find a wedding", "Trouver un mariage"],
  ["Project dashboard", "Tableau du projet"],
  ["Project comments", "Commentaires du projet"],
  ["Commercial work", "Commercial"],
  ["Guest imports", "Imports invités"],
  ["Couple view", "Vue couple"],
  ["Guest book", "Livre d’or"],
  ["Guest list", "Liste d’invités"],
  ["Communication state", "État des messages"],
  ["Digital invitation", "Invitation numérique"],
  ["Printed invitation", "Invitation imprimée"],
  ["Bride side", "Côté mariée"],
  ["Both sides", "Deux côtés"],
  ["Groom side", "Côté marié"],
  ["All sides", "Tous les côtés"],
  ["All events", "Tous les événements"],
  ["Invitation designs for", "Designs d’invitation pour"],
  ["Register a PDF design for", "Enregistrer un design PDF pour"],
  ["Guest-book review for", "Revue du livre d’or pour"],
  ["Messages for", "Messages pour"],
  ["Add a guest to", "Ajouter un invité à"],
  [
    "Confirm this session before opening protected work.",
    "Confirmez cette session avant d’ouvrir les espaces protégés.",
  ],
  [
    "Use the current six-digit code from your authenticator app.",
    "Utilisez le code actuel à six chiffres de votre application d’authentification.",
  ],
  [
    "Authenticator codes refresh quickly. Use the newest code shown in your app.",
    "Les codes d’authentification changent vite. Utilisez le code le plus récent affiché dans votre application.",
  ],
  [
    "Protected pages open after this session reaches the required verification level.",
    "Les pages protégées s’ouvrent lorsque cette session atteint le niveau de vérification requis.",
  ],
  [
    "Enter the latest code, then continue to your requested page.",
    "Saisissez le dernier code, puis continuez vers la page demandée.",
  ],
  ["Session verification", "Vérification de session"],
  ["Verification code", "Code de vérification"],
  ["Verify session", "Vérifier la session"],
  ["Back to sign in", "Retour à la connexion"],
  ["Protected access", "Accès protégé"],
  ["Two-step verification", "Vérification en deux étapes"],
  ["Activity history", "Historique d’activité"],
  ["Operations overview", "Vue d’ensemble des opérations"],
  ["Event check-in", "Accueil de l’événement"],
  ["QR check-in", "Accueil QR"],
  ["Event operations dashboard", "Tableau de bord de l’événement"],
  ["Event file handoff", "Transmission des fichiers de l’événement"],
  ["Invitation design", "Design d’invitation"],
  ["Seating plan", "Plan de table"],
  ["Seating map", "Plan de salle"],
  ["Partner dashboard", "Tableau de bord partenaire"],
  ["Partner project review", "Revue des projets partenaires"],
  ["Wedding update thread", "Fil d’actualité du mariage"],
  ["Contracts, pricing, and payments", "Contrats, tarifs et paiements"],
  ["Custom message", "Message personnalisé"],
  ["Prepare WhatsApp messages", "Préparer les messages WhatsApp"],
  [
    "Prepare reusable guest message wording",
    "Préparer les textes invités réutilisables",
  ],
  ["Event feedback and testimonials", "Retours et témoignages"],
  ["Wedding file vault", "Coffre-fort des fichiers du mariage"],
  ["Registered file", "Fichier enregistré"],
  ["Review guest-book messages", "Relire les messages du livre d’or"],
  ["Review imported guest rows", "Revoir les lignes d’invités importées"],
  [
    "Match CSV columns to guest fields",
    "Associer les colonnes CSV aux champs invités",
  ],
  [
    "Decide which imported rows can be used",
    "Décider quelles lignes importées utiliser",
  ],
  ["Upload guest list", "Importer une liste d’invités"],
  ["Guest profile", "Profil invité"],
  ["Guest responses", "Réponses des invités"],
  [
    "Guest records are not requested until Supabase credentials are configured.",
    "Les dossiers invités ne sont pas demandés tant que la connexion n’est pas prête.",
  ],
  [
    "Project data will appear after the workspace connection is ready.",
    "Les données du mariage apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Use the email address approved for this workspace.",
    "Utilisez l’adresse e-mail approuvée pour cet espace.",
  ],
  [
    "Enter the latest code sent to your inbox.",
    "Saisissez le dernier code envoyé dans votre boîte mail.",
  ],
  [
    "Repeated requests may be rate limited.",
    "Les demandes répétées peuvent être limitées.",
  ],
  [
    "Sensitive areas may request another verification step before protected records are shown.",
    "Les zones sensibles peuvent demander une vérification supplémentaire avant d’afficher les dossiers protégés.",
  ],
  [
    "Personal details stay permission limited.",
    "Les informations personnelles restent limitées par permission.",
  ],
  [
    "Commercial records require approved access.",
    "Les dossiers commerciaux demandent un accès approuvé.",
  ],
  [
    "Reviews and changes remain traceable.",
    "Les revues et modifications restent traçables.",
  ],
  [
    "You only see weddings connected to this account.",
    "Vous voyez seulement les mariages liés à ce compte.",
  ],
  [
    "Open one to continue inside its project workspace.",
    "Ouvrez-en un pour continuer dans son espace de travail.",
  ],
  [
    "This account does not have an assigned work area.",
    "Ce compte n’a pas encore d’espace de travail attribué.",
  ],
  [
    "Ask an administrator to add the right role or project access.",
    "Demandez à un administrateur d’ajouter le bon rôle ou accès projet.",
  ],
  ["Move through this wedding by task.", "Avancez dans ce mariage par tâche."],
  [
    "Each destination appears only when your role can use it.",
    "Chaque destination apparaît seulement si votre rôle peut l’utiliser.",
  ],
  [
    "Keep names, family sides, contact routes, invitation readiness, and event assignments in one controlled place.",
    "Gardez les noms, côtés de famille, contacts, invitations et affectations d’événements dans un endroit contrôlé.",
  ],
  [
    "Narrow by family side or event without leaving the project.",
    "Filtrez par côté de famille ou événement sans quitter le mariage.",
  ],
  [
    "Review contact routes, family sides, invitation readiness, and profile status.",
    "Revoyez les contacts, côtés de famille, invitations et statuts de profil.",
  ],
  [
    "Diginoces prepares and records messages, but the team still opens WhatsApp manually and confirms the outcome.",
    "Diginoces prépare et enregistre les messages, mais l’équipe ouvre toujours WhatsApp manuellement et confirme le résultat.",
  ],
  [
    "No automatic sending is triggered from this page.",
    "Aucun envoi automatique n’est déclenché depuis cette page.",
  ],
  [
    "Templates keep bilingual guest messages consistent.",
    "Les modèles gardent les messages invités cohérents en français et en anglais.",
  ],
  [
    "The safest flow is prepare, review, open WhatsApp, then record the result.",
    "Le flux le plus sûr est de préparer, revoir, ouvrir WhatsApp, puis enregistrer le résultat.",
  ],
  [
    "Uploaded files are parsed into review rows; source files are not persisted here.",
    "Les fichiers importés sont transformés en lignes de revue ; les fichiers source ne sont pas conservés ici.",
  ],
  [
    "Rows must pass validation and approval before guests are created.",
    "Les lignes doivent être validées et approuvées avant la création des invités.",
  ],
  [
    "The app only opens areas available to this account. If a destination is missing, the role or project membership needs review.",
    "L’application ouvre seulement les espaces accessibles à ce compte. Si une destination manque, le rôle ou l’accès au mariage doit être revu.",
  ],
  [
    "These are the direct entry points available to the current account. Each one leads into a controlled work area.",
    "Ce sont les accès directs disponibles pour ce compte. Chaque lien mène vers un espace de travail contrôlé.",
  ],
  [
    "Open a wedding first for wedding-specific work. Diginoces separates planning, guest preparation, communication, event-day execution, and controlled review.",
    "Ouvrez d’abord un mariage pour le travail propre à ce dossier. Diginoces sépare la préparation, les invités, les messages, l’exécution du jour J et les revues contrôlées.",
  ],
] as const;

function assertPhraseReplacementOrder(
  replacements: readonly (readonly [string, string])[],
) {
  replacements.forEach(([source], sourceIndex) => {
    replacements.slice(sourceIndex + 1).forEach(([laterSource]) => {
      if (laterSource.includes(source)) {
        throw new Error(
          `Static translation phrase "${source}" must appear after longer phrase "${laterSource}".`,
        );
      }
    });
  });
}

assertPhraseReplacementOrder(phraseEnglishToFrench);

const exactFrenchToEnglish = Object.fromEntries(
  Object.entries(exactEnglishToFrench).map(([english, french]) => [
    french,
    english,
  ]),
) as Record<string, string>;

const phraseFrenchToEnglish = phraseEnglishToFrench.map(
  ([english, french]) => [french, english] as const,
);

const englishMonthsToFrench: Record<string, string> = {
  Apr: "avr.",
  Aug: "août",
  Dec: "déc.",
  Feb: "févr.",
  Jan: "janv.",
  Jul: "juil.",
  Jun: "juin",
  Mar: "mars",
  May: "mai",
  Nov: "nov.",
  Oct: "oct.",
  Sep: "sept.",
};

const frenchMonthsToEnglish = Object.fromEntries(
  Object.entries(englishMonthsToFrench).map(([english, french]) => [
    french,
    english,
  ]),
) as Record<string, string>;

function splitOuterWhitespace(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length);

  return { core, leading, trailing };
}

function applyPhraseReplacements(
  value: string,
  replacements: readonly (readonly [string, string])[],
) {
  return replacements.reduce(
    (current, [source, target]) => current.replaceAll(source, target),
    value,
  );
}

function translateDateLikeCopy(value: string, language: SupportedLanguage) {
  if (language === "fr") {
    const englishMatch = value.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})(.*)$/,
    );

    if (englishMatch) {
      const [, month, day, year, suffix] = englishMatch;

      return `${day} ${englishMonthsToFrench[month]} ${year}${suffix.replace(
        /^, /,
        " à ",
      )}`;
    }
  }

  const frenchMatch = value.match(
    /^(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.) (\d{4})(.*)$/,
  );

  if (language === "en" && frenchMatch) {
    const [, day, month, year, suffix] = frenchMatch;

    return `${frenchMonthsToEnglish[month]} ${day}, ${year}${suffix.replace(
      /^ à /,
      ", ",
    )}`;
  }

  return value;
}

/**
 * Translates static product UI copy between supported shell languages.
 *
 * @param value - The string to translate. Leading and trailing whitespace are
 * preserved, and unknown/user-provided copy is returned unchanged.
 * @param language - Target language. Defaults to the product default (`fr`);
 * supported values are `fr` and `en`.
 * @returns The translated string when a static exact/phrase/date translation is
 * available; otherwise returns the original value.
 *
 * @example
 * translateStaticCopy("Guest list", "fr") // "Liste d’invités"
 */
export function translateStaticCopy(
  value: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
) {
  const { core, leading, trailing } = splitOuterWhitespace(value);

  if (core.length === 0) {
    return value;
  }

  const exact =
    language === "fr"
      ? core in exactEnglishToFrench
        ? exactEnglishToFrench[core as keyof typeof exactEnglishToFrench]
        : undefined
      : exactFrenchToEnglish[core];

  if (exact) {
    return `${leading}${exact}${trailing}`;
  }

  const translated = applyPhraseReplacements(
    translateDateLikeCopy(core, language),
    language === "fr" ? phraseEnglishToFrench : phraseFrenchToEnglish,
  );

  return `${leading}${translated}${trailing}`;
}

/**
 * Checks whether a string has a known French static translation.
 *
 * @param value - Static UI copy to inspect.
 * @returns `true` when translating the value to French changes it; otherwise
 * `false`.
 */
export function hasStaticTranslation(value: string) {
  return translateStaticCopy(value, "fr") !== value;
}

/**
 * Reports exact-translation integrity counts for tests and QA reports.
 *
 * @returns An object containing the total exact French value count and the
 * unique exact French value count.
 */
export function getStaticTranslationIntegritySummary() {
  const exactFrenchValues = Object.values(exactEnglishToFrench);

  return {
    exactFrenchValueCount: exactFrenchValues.length,
    uniqueExactFrenchValueCount: new Set(exactFrenchValues).size,
  };
}
