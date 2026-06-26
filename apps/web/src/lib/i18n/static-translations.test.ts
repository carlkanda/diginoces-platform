import { describe, expect, it } from "vitest";
import {
  getStaticTranslationIntegritySummary,
  hasStaticTranslation,
  translateStaticCopy,
} from "@/lib/i18n/static-translations";
import { formatLocalizedDate, getLanguageHtmlLang } from "@/lib/i18n/config";
import { homeCopy } from "@/lib/i18n/home-copy";

describe("static UI translation helpers", () => {
  it("uses French as the default target language", () => {
    expect(translateStaticCopy("Workspace")).toBe("Espace de travail");
  });

  it("preserves outer whitespace", () => {
    expect(translateStaticCopy("  Sign in  ", "fr")).toBe("  Se connecter  ");
  });

  it("can reverse translated copy back to English", () => {
    expect(translateStaticCopy("Liste d’invités", "en")).toBe("Guest list");
  });

  it("applies phrase replacements inside longer helper text", () => {
    expect(
      translateStaticCopy(
        "Rows must pass validation and approval before guests are created.",
        "fr",
      ),
    ).toBe(
      "Les lignes doivent être validées et approuvées avant la création des invités.",
    );
  });

  it("leaves unknown user data unchanged", () => {
    expect(translateStaticCopy("Carl & Diginoces", "fr")).toBe(
      "Carl & Diginoces",
    );
  });

  it("localizes common English date output to French", () => {
    expect(translateStaticCopy("Jun 21, 2026, 3:31 PM", "fr")).toBe(
      "21 juin 2026 à 3:31 PM",
    );
  });

  it("localizes generated count labels in both directions", () => {
    expect(translateStaticCopy("2 events", "fr")).toBe("2 événements");
    expect(translateStaticCopy("1 guest", "fr")).toBe("1 invité");
    expect(translateStaticCopy("3 lignes", "en")).toBe("3 rows");
    expect(translateStaticCopy("Field 1", "fr")).toBe("Champ 1");
    expect(translateStaticCopy("Champ 2", "en")).toBe("Field 2");
    expect(translateStaticCopy("1 open", "fr")).toBe("1 libre");
    expect(translateStaticCopy("2 open", "fr")).toBe("2 libres");
    expect(translateStaticCopy("1 open.", "fr")).toBe("1 libre.");
    expect(translateStaticCopy("1 libre", "en")).toBe("1 open");
    expect(translateStaticCopy("1 libre.", "en")).toBe("1 open.");
    expect(
      translateStaticCopy("1 / 2 active seats assigned, 1 open.", "fr"),
    ).toBe("1 / 2 places actives attribuées, 1 libre.");
    expect(
      translateStaticCopy("1 / 2 places actives attribuées, 1 libre.", "en"),
    ).toBe("1 / 2 active seats assigned, 1 open.");
    expect(translateStaticCopy("1 prepared message", "fr")).toBe(
      "1 message préparé",
    );
    expect(translateStaticCopy("2 prepared messages", "fr")).toBe(
      "2 messages préparés",
    );
    expect(translateStaticCopy("1 recent message", "fr")).toBe(
      "1 message récent",
    );
    expect(translateStaticCopy("2 recent messages", "fr")).toBe(
      "2 messages récents",
    );
    expect(translateStaticCopy("1 invited event", "fr")).toBe(
      "1 événement inclus",
    );
    expect(translateStaticCopy("2 invited events", "fr")).toBe(
      "2 événements inclus",
    );
    expect(translateStaticCopy("2 of 5 records", "fr")).toBe(
      "2 dossiers affichés sur 5",
    );
    expect(translateStaticCopy("60 of 60 records", "fr")).toBe(
      "60 dossiers affichés sur 60",
    );
    expect(translateStaticCopy("2 dossiers affichés sur 5", "en")).toBe(
      "2 of 5 records",
    );
    expect(translateStaticCopy("1 table positioned", "fr")).toBe(
      "1 table positionnée",
    );
    expect(translateStaticCopy("2 tables positioned", "fr")).toBe(
      "2 tables positionnées",
    );
    expect(translateStaticCopy("1 linked account", "fr")).toBe("1 compte lié");
    expect(translateStaticCopy("2 linked accounts", "fr")).toBe(
      "2 comptes liés",
    );
    expect(translateStaticCopy("1 approved row", "fr")).toBe(
      "1 ligne approuvée",
    );
    expect(translateStaticCopy("2 approved rows", "fr")).toBe(
      "2 lignes approuvées",
    );
    expect(translateStaticCopy("1 message préparé", "en")).toBe(
      "1 prepared message",
    );
    expect(translateStaticCopy("2 messages préparés", "en")).toBe(
      "2 prepared messages",
    );
    expect(translateStaticCopy("1 compte lié", "en")).toBe("1 linked account");
    expect(translateStaticCopy("2 comptes liés", "en")).toBe(
      "2 linked accounts",
    );
    expect(translateStaticCopy("1 ligne approuvée", "en")).toBe(
      "1 approved row",
    );
    expect(translateStaticCopy("2 lignes approuvées", "en")).toBe(
      "2 approved rows",
    );
  });

  it("does not translate inherited object property names", () => {
    expect(translateStaticCopy("constructor", "fr")).toBe("constructor");
    expect(translateStaticCopy("toString", "fr")).toBe("toString");
  });

  it("reports whether text has a French translation", () => {
    expect(hasStaticTranslation("Guest list")).toBe(true);
    expect(hasStaticTranslation("Custom wedding name")).toBe(false);
  });

  it("covers login and hover guidance strings used by the simplified UI", () => {
    const translatedStrings = [
      "Sign in to the Diginoces workspace.",
      "Enter your approved email address. Then use the six-digit code sent to your inbox.",
      "Request email code",
      "Send email code",
      "Enter the code from your email",
      "A six-digit code was sent to",
      "Use a different email",
      "You only see weddings connected to this account. Open one to continue inside its project workspace.",
      "Start with the records most teams need first. Available actions still depend on your role.",
      "This compact view shows wording readiness, prepared messages, and work waiting for a manual send.",
      "Use this queue to see what needs attention before the team records a final sending result.",
      "Open nearby workflows without losing the current project.",
      "Search Diginoces",
      "Search workspace",
      "Find the right wedding, event, guest, invitation, message, report, or control area without learning the whole navigation first.",
      "Try a workflow word such as guests, RSVP, imports, invitations, messages, seating, check-in, reports, or partners.",
      "Search opens the destination; sensitive records still follow your role, MFA, and project access.",
      "Suggested next step",
    ];

    translatedStrings.forEach((value) => {
      expect(hasStaticTranslation(value)).toBe(true);
    });
  });

  it("handles empty strings safely", () => {
    expect(translateStaticCopy("", "fr")).toBe("");
    expect(hasStaticTranslation("")).toBe(false);
  });

  it("preserves special characters and newlines in unknown copy", () => {
    const customCopy = 'Custom "wedding"\nline &amp; details';

    expect(translateStaticCopy(customCopy, "fr")).toBe(customCopy);
  });

  it("applies known replacements inside long text without changing unknown text", () => {
    const customSuffix =
      " Keep this custom venue instruction exactly as written.";
    const translated = translateStaticCopy(
      `Rows must pass validation and approval before guests are created.${customSuffix}`,
      "fr",
    );

    expect(translated).not.toBe(
      `Rows must pass validation and approval before guests are created.${customSuffix}`,
    );
    expect(translated).toContain(customSuffix);
  });

  it("keeps commercial labels stable across repeated English localization passes", () => {
    const label =
      "Commercial: Review packages, contract status, payments, and guest-page gates.";

    expect(translateStaticCopy("Commercial", "en")).toBe("Commercial");
    expect(
      translateStaticCopy(
        translateStaticCopy(translateStaticCopy(label, "en"), "en"),
        "en",
      ),
    ).toBe(label);
  });

  it("keeps commercial work-area copy stable across repeated language cycles", () => {
    const label =
      "Commercial: Review packages, contract status, payments, and guest-page gates.";
    let current = label;

    for (let index = 0; index < 4; index += 1) {
      current = translateStaticCopy(current, "fr");
      expect(current).toBe(
        "Contrats et paiements : Vérifiez les forfaits, contrats, paiements et accès aux pages invités.",
      );

      current = translateStaticCopy(current, "en");
      expect(current).toBe(label);
    }
  });

  it("covers common project detail labels and helper copy", () => {
    const projectDetailCopy = [
      "Open the next area of work for this wedding.",
      "Use dashboards and reports to understand where this wedding stands.",
      "Build the guest list, review imports, collect responses, and prepare messages.",
      "Keep the project moving with files, commercial controls, partner comments, and post-event work.",
      "Open an event for invitations, seating, check-in, files, and event-level dashboards.",
      "Project tasks that keep guest, invitation, seating, and event-day work on track.",
      "Use the visible work areas above to continue guest, RSVP, invitation, messaging, seating, or file work.",
      "Work areas, events, and actions are limited to what your role can access.",
      "Missing destinations usually mean the project membership or role assignment needs review.",
      "Start with guest list readiness when available, then move into RSVP, invitations, messages, seating, and check-in as the event approaches.",
      "Not set",
      "Venue not set",
      "Permission-scoped workspace",
      "Readiness tasks",
      "Not Started",
      "Task",
      "Feedback",
      "Commercial",
      "Find a wedding, check its state, and open the next work area.",
      "Guest-list access opens after the project contract is approved in the app.",
      "Contract approval required",
    ];

    projectDetailCopy.forEach((value) => {
      expect(hasStaticTranslation(value)).toBe(true);
    });
  });

  it("covers route-family labels found during the French UI audit", () => {
    // This array is a regression manifest: every value below must be backed by
    // static-translations.ts, and the assertions verify both detection and the
    // actual French output.
    const auditedCopy = [
      ["View operations dashboard", "Voir le tableau des opérations"],
      ["Confirmed payment total", "Total des paiements confirmés"],
      ["No deadline set", "Aucune échéance définie"],
      ["Access readiness", "Préparation de l’accès"],
      ["Save selection", "Enregistrer la sélection"],
      ["No estimate yet", "Aucune estimation pour le moment"],
      ["Wedding context", "Contexte du mariage"],
      ["Expected amount", "Montant attendu"],
      ["File register", "Registre des fichiers"],
      ["Register a protected file", "Enregistrer un fichier protégé"],
      [
        "What is live in this wedding right now.",
        "Ce qui est actif dans ce mariage en ce moment.",
      ],
      [
        "Explain why this retention action is being recorded.",
        "Expliquez pourquoi cette action de conservation est enregistrée.",
      ],
      [
        "Bring spreadsheet guest lists into the project, validate rows, review decisions, and add only approved guests to the active list.",
        "Importez les listes d’invités depuis un tableur, validez les lignes, revoyez les décisions et ajoutez seulement les invités approuvés à la liste active.",
      ],
      [
        "Rows that need correction before use.",
        "Lignes à corriger avant utilisation.",
      ],
      [
        "Open an import to confirm mapping, review rows, or apply approved guests.",
        "Ouvrez un import pour confirmer les colonnes, relire les lignes ou ajouter les invités approuvés.",
      ],
      [
        "Guest import remains controlled before guests are added.",
        "L’import d’invités reste contrôlé avant tout ajout à la liste.",
      ],
      [
        "Include the header row so Diginoces can suggest column matches. Paste rows only when you are not uploading a file.",
        "Incluez la ligne d’en-tête pour que Diginoces suggère les correspondances. Collez des lignes seulement si vous n’importez pas de fichier.",
      ],
      ["Source file handling", "Gestion du fichier source"],
      ["Before saving", "Avant l’enregistrement"],
      ["Available setup", "Configuration disponible"],
      ["Check digital readiness", "Vérifier la préparation numérique"],
      ["Available downloads", "Téléchargements disponibles"],
      ["Not submitted", "Non envoyé"],
      [
        "This preview is available only to authorized users.",
        "Cet aperçu est disponible seulement pour les utilisateurs autorisés.",
      ],
      ["Template library", "Bibliothèque de modèles"],
      ["Available recipients", "Destinataires disponibles"],
      [
        "A quick check before the team starts manual sending work.",
        "Une vérification rapide avant que l’équipe commence les envois manuels.",
      ],
      ["Eligible for keepsake work", "Éligible au travail souvenir"],
      ["Protect the keepsake", "Protéger le souvenir"],
      ["Export readiness", "Préparation de l’export"],
      [
        "Request a correction when wording, names, or tone need a careful adjustment before export.",
        "Demandez une correction quand le texte, les noms ou le ton nécessitent un ajustement avant l’export.",
      ],
      [
        "Couple decisions shape the final keepsake",
        "Les décisions du couple façonnent le souvenir final",
      ],
      [
        "Partner-visible updates may be seen by authorized partner users. Team-only updates stay internal.",
        "Les mises à jour visibles par les partenaires peuvent être vues par les partenaires autorisés. Les mises à jour équipe restent internes.",
      ],
      ["Post comment", "Publier le commentaire"],
      ["Submit feedback", "Envoyer le retour"],
      [
        "Private feedback helps improve operations and is not public testimonial copy.",
        "Les retours privés aident à améliorer les opérations et ne sont pas des témoignages publics.",
      ],
      ["Not rated", "Non noté"],
      [
        "Partner records are not connected",
        "Les dossiers partenaires ne sont pas connectés",
      ],
      [
        "Partner work becomes available after this account is linked to a partner profile.",
        "Le travail partenaire devient disponible après liaison de ce compte à un profil partenaire.",
      ],
      [
        "Use the best estimate available today.",
        "Utilisez la meilleure estimation disponible aujourd’hui.",
      ],
      [
        "Partner profiles can prepare or receive work, but final project control stays with Diginoces.",
        "Les profils partenaires peuvent préparer ou recevoir du travail, mais le contrôle final du mariage reste chez Diginoces.",
      ],
      [
        "Review partner-submitted wedding projects before they become active Diginoces operations.",
        "Revoyez les mariages soumis par les partenaires avant leur passage en opérations Diginoces actives.",
      ],
      [
        "Approve only submissions that are ready to move into Diginoces operations.",
        "Approuvez seulement les soumissions prêtes à passer en opérations Diginoces.",
      ],
      [
        "Guest lists waiting for validation or approval.",
        "Listes d’invités en attente de validation ou d’approbation.",
      ],
      [
        "Use the overview to choose the right operational surface.",
        "Utilisez la vue d’ensemble pour choisir la bonne zone opérationnelle.",
      ],
      ["Report catalog", "Catalogue des rapports"],
      ["Report export is ready", "L’export de rapport est prêt"],
      ["Available reports", "Rapports disponibles"],
      ["Ready in this context", "Disponible dans ce contexte"],
      ["Event reporting context", "Contexte de rapport événement"],
      [
        "Review the latest matching records before exporting an activity CSV.",
        "Revoyez les derniers enregistrements correspondants avant d’exporter un CSV d’activité.",
      ],
      [
        "Use one or more filters to narrow the activity history.",
        "Utilisez un ou plusieurs filtres pour réduire l’historique d’activité.",
      ],
      [
        "Use a team member ID when available.",
        "Utilisez l’ID du membre d’équipe quand il est disponible.",
      ],
      [
        "Event details will appear after the workspace connection is ready.",
        "Les détails de l’événement apparaîtront quand la connexion de l’espace sera prête.",
      ],
      [
        "Event data stays closed until the secure workspace connection is ready.",
        "Les données de l’événement restent fermées jusqu’à ce que la connexion sécurisée soit prête.",
      ],
      [
        "Guest page fields are not check-in credentials",
        "Les champs de page invité ne sont pas des identifiants d’accueil",
      ],
      [
        "Use values from 0 to 1 for left-to-right and top-to-bottom placement.",
        "Utilisez des valeurs de 0 à 1 pour le placement gauche-droite et haut-bas.",
      ],
      [
        "Save fields before generating a preview.",
        "Enregistrez les champs avant de générer un aperçu.",
      ],
      [
        "Generate a technical preview, inspect field placement, then approve it before batch generation.",
        "Générez un aperçu technique, vérifiez le placement des champs, puis approuvez-le avant la génération par lot.",
      ],
      [
        "Guest files linked to this design after generation.",
        "Fichiers invités liés à ce design après génération.",
      ],
      ["Global workspace", "Espace global"],
      ["Workspace signals", "Signaux de l’espace"],
      ["Confirmed payment volume", "Volume de paiements confirmés"],
      ["Imports needing review", "Imports à revoir"],
      ["Messages needing action", "Messages à traiter"],
      ["Unexpected guest requests", "Demandes d’invités imprévus"],
      ["Activity export was created", "L’export d’activité a été créé"],
      [
        "Activity export needs attention",
        "L’export d’activité nécessite une attention",
      ],
      [
        "Activity records are operational evidence",
        "Les dossiers d’activité servent de preuve opérationnelle",
      ],
      ["Team-only access", "Accès réservé à l’équipe"],
      ["Sensitive details redacted", "Détails sensibles expurgés"],
      [
        "Two-step verification is not ready",
        "La vérification en deux étapes n’est pas prête",
      ],
      [
        "Verification status unavailable",
        "Statut de vérification indisponible",
      ],
      [
        "Wedding and event reports unlock when this page is opened from the matching workspace.",
        "Les rapports mariage et événement se déverrouillent quand cette page est ouverte depuis l’espace correspondant.",
      ],
      [
        "Each export is scoped to the current workspace, wedding, or event context.",
        "Chaque export est limité au contexte actuel de l’espace, du mariage ou de l’événement.",
      ],
      [
        "Open dashboard for Wedding project 1",
        "Ouvrir le tableau de bord de Wedding project 1",
      ],
      [
        "Review queue, Partner dashboard, Create partner",
        "File de revue, espace partenaire, création de partenaire",
      ],
      [
        "Partner work becomes available after this account is linked to a profile.",
        "Le travail partenaire devient disponible après liaison de ce compte à un profil.",
      ],
    ] as const;

    auditedCopy.forEach(([value, expectedFrench]) => {
      expect(hasStaticTranslation(value)).toBe(true);
      expect(translateStaticCopy(value, "fr")).toBe(expectedFrench);
    });

    expect(translateStaticCopy("Open CSV import 2", "fr")).toBe(
      "Ouvrir l’import CSV 2",
    );
    expect(translateStaticCopy("Operational: 1 wedding.", "fr")).toBe(
      "Opérationnel : 1 mariage.",
    );
  });

  it("covers labels from the deep translation review", () => {
    const reviewedLabels = [
      ["Diginoces Platform", "Plateforme Diginoces"],
      [
        "Wedding guest operations workspace for Diginoces.",
        "Espace Diginoces de pilotage des invités de mariage.",
      ],
      ["Session verification", "Contrôle de session"],
      ["Approvals", "Approbations"],
      ["Evidence", "Preuves"],
      ["Access control", "Gestion des accès"],
      ["Primary navigation", "Navigation principale"],
      ["Public navigation", "Navigation publique"],
      ["Toggle navigation", "Afficher ou masquer la navigation"],
      [
        "Active and previously revoked global role assignments.",
        "Attributions de rôles globaux actives ou déjà révoquées.",
      ],
      [
        "Adjust the filters or clear them to see every global access record.",
        "Ajustez les filtres ou effacez-les pour afficher toutes les attributions de rôles globaux.",
      ],
      [
        "Assign sensitive platform roles to existing Diginoces users. Wedding and event access stays inside each project or event setup page.",
        "Attribuez les rôles sensibles de la plateforme aux utilisateurs Diginoces existants. Les accès aux mariages et aux événements se gèrent dans leurs pages de configuration respectives.",
      ],
      ["Existing users only", "Utilisateurs existants uniquement"],
      ["Audit Viewer", "Lecteur d’audit"],
      ["Diginoces Admin", "Admin Diginoces"],
      ["File Manager", "Gestionnaire de fichiers"],
      ["Operations Manager", "Responsable opérations"],
      ["Role Manager", "Gestionnaire de rôles"],
      ["Select a global role", "Sélectionner un rôle global"],
      [
        "Can review and export foundation audit records.",
        "Peut consulter et exporter les journaux d’audit de la plateforme.",
      ],
      [
        "Reviews foundation audit records.",
        "Consulte les journaux d’audit de la plateforme.",
      ],
      [
        "Internal administrator with foundation-level access.",
        "Administrateur interne avec accès complet à la plateforme.",
      ],
      [
        "Can manage app-owned operational files through approved services.",
        "Peut gérer les fichiers opérationnels de l’application via les services approuvés.",
      ],
      [
        "Manages app-owned operational files through approved services.",
        "Gère les fichiers opérationnels de l’application via les services approuvés.",
      ],
      [
        "Can operate foundation services without sensitive admin controls.",
        "Peut piloter les services opérationnels sans les contrôles administrateur sensibles.",
      ],
      [
        "Operates foundation services without sensitive admin controls.",
        "Pilote les services opérationnels sans les contrôles administrateur sensibles.",
      ],
      [
        "Can manage roles and permissions.",
        "Peut gérer les rôles et permissions.",
      ],
      [
        "Manages roles and permissions through approved backend services.",
        "Gère les rôles et permissions via les services backend approuvés.",
      ],
      [
        "Assign a role to an existing user before they can open protected platform areas.",
        "Attribuez un rôle à un utilisateur existant avant qu’il puisse ouvrir les zones protégées de la plateforme.",
      ],
      [
        "Find a user, role, or status before changing access.",
        "Recherchez un utilisateur, un rôle ou un statut avant de modifier les accès.",
      ],
      [
        "Global role access was revoked.",
        "L'attribution du rôle global a été révoquée.",
      ],
      [
        "Global role access was updated.",
        "L'attribution du rôle global a été mise à jour.",
      ],
      [
        "The access change could not be completed. Confirm the request is still valid, then try again.",
        "La modification des accès n'a pas pu être effectuée. Vérifiez que la demande est toujours valide, puis réessayez.",
      ],
      [
        "Use this for Diginoces administrators, operations managers, role managers, and other platform-level roles.",
        "Utilisez ce formulaire pour les administrateurs Diginoces, responsables opérations, gestionnaires de rôles et autres rôles de plateforme.",
      ],
      ["User", "Utilisateur"],
      ["Assigned", "Assigné"],
      ["From", "Du"],
      ["To", "Au"],
      ["Record", "Dossier"],
      ["Time", "Heure"],
      ["Signal", "Indicateur"],
      ["Source", "Origine"],
      ["Prepared", "Préparé"],
      ["Generated", "Généré"],
      ["Value", "Valeur"],
      ["Toggle Sidebar", "Afficher ou masquer le panneau de navigation"],
      ["Breadcrumb", "Fil d'Ariane"],
      ["Count", "Nombre"],
      ["Scope", "Périmètre"],
      ["Areas", "Zones"],
      ["Checkpoint", "Point de contrôle"],
      ["Detail", "Détail"],
      ["Category", "Catégorie"],
      ["Run", "Lot"],
      ["Runs", "Lots"],
      ["Fields", "Champs"],
      ["Field", "Champ"],
      ["Label", "Libellé"],
      ["Horizontal", "Position horizontale"],
      ["Vertical", "Position verticale"],
      ["Width", "Largeur"],
      ["Height", "Hauteur"],
      ["Alignment", "Alignement"],
      ["Left", "Gauche"],
      ["Center", "Centre"],
      ["Right", "Droite"],
      ["Designs", "Créations"],
      ["Design", "Création"],
      ["Area", "Zone"],
      ["Purpose", "Objectif"],
      ["State", "État"],
      ["Complete", "Terminer"],
      ["Reject", "Rejeter"],
      ["Remaining", "Restant"],
      ["Arrivals", "Arrivées"],
      ["Settings", "Paramètres"],
      ["Arrival", "Arrivée"],
      ["Enabled", "Activé"],
      ["Timezone", "Fuseau horaire"],
      ["Disabled", "Désactivé"],
      ["Name", "Nom"],
      ["Unknown", "Inconnu"],
      ["Reason", "Raison"],
      ["Station", "Poste"],
      ["Device", "Appareil"],
      ["Sync", "Synchronisation"],
      ["Add", "Ajouter"],
      ["Update", "Mettre à jour"],
      ["Save", "Enregistrer"],
      ["Submissions", "Soumissions"],
      ["Reference", "Référence"],
      ["Inactive", "Inactif"],
      ["Member", "Membre"],
      ["Admin", "Administrateur"],
      ["Added", "Ajouté"],
      ["Organization", "Organisation"],
      ["Archive", "Archiver"],
      ["Thread", "Fil"],
      ["Amount", "Montant"],
      ["Percentage", "Pourcentage"],
      ["Method", "Méthode"],
      ["Confirm", "Confirmer"],
      ["Payment", "Paiement"],
      ["Flat", "Fixe"],
      ["Item", "Élément"],
      ["Addendums", "Avenants"],
      ["Addendum", "Avenant"],
      ["Gate", "Contrôle d’accès"],
      ["Channel", "Canal"],
      ["Wording", "Texte"],
      ["None", "Aucun"],
      ["Context", "Contexte"],
      ["Attempts", "Tentatives"],
      ["Title", "Titre"],
      ["Overall", "Global"],
      ["Responses", "Réponses"],
      ["Size", "Taille"],
      ["Versions", "Versions"],
      ["Result", "Résultat"],
      ["Showing", "Affichage"],
      ["Excluded", "Exclu"],
      ["Exclude", "Exclure"],
      ["Headers", "En-têtes"],
      ["Reviewed", "Relu"],
      ["Guest list summary", "Résumé de la liste d’invités"],
      ["Create first event", "Créer le premier événement"],
      ["Create wedding", "Créer un mariage"],
      ["Wedding project was not created", "Le mariage n’a pas été créé"],
      ["Create a wedding project", "Créer un dossier de mariage"],
      [
        "Start the secure workspace for a couple. Events, guests, invitations, and delivery work stay inside the project after it is created.",
        "Démarrez l’espace sécurisé du couple. Les événements, invités, invitations et opérations de livraison resteront dans le dossier après sa création.",
      ],
      ["Admin action", "Action administrateur"],
      ["Contact name", "Nom du contact"],
      [
        "Add dates, venues, or delivery context that helps the operations team start cleanly.",
        "Ajoutez les dates, lieux ou éléments de livraison utiles à l’équipe opérations pour démarrer proprement.",
      ],
      ["Create wedding project", "Créer le dossier mariage"],
      ["Retention action", "Action de conservation"],
      ["Mark retention complete", "Marquer la conservation terminée"],
      ["Extend retention date", "Prolonger la date de conservation"],
      ["Extend retention through", "Prolonger la conservation jusqu’au"],
      [
        "Choose the new retention end date.",
        "Choisissez la nouvelle date de fin de conservation.",
      ],
      [
        "Assign or revoke sensitive platform roles for existing Diginoces users.",
        "Attribuez ou révoquez les rôles sensibles de plateforme pour les utilisateurs Diginoces existants.",
      ],
      ["Manage access control", "Gérer les accès"],
      [
        "Assign platform roles to existing users, then keep wedding and event roles scoped inside the right workspace.",
        "Attribuez les rôles de plateforme aux utilisateurs existants, puis gardez les rôles mariage et événement dans le bon espace.",
      ],
      [
        "Access management is unavailable until the workspace connection is ready.",
        "La gestion des accès est indisponible tant que la connexion de l'espace n'est pas prête.",
      ],
      [
        "Setup is unavailable until the workspace connection is ready.",
        "La configuration est indisponible tant que la connexion de l'espace n'est pas prête.",
      ],
      ["Event was created.", "L'événement a été créé."],
      [
        "Event details were saved.",
        "Les détails de l'événement ont été enregistrés.",
      ],
      ["Invited events", "Événements inclus"],
      ["invited events", "événements inclus"],
      [
        ". Scan again or use manual guest search from check-in.",
        ". Scannez à nouveau ou utilisez la recherche manuelle d’invité depuis l’accueil.",
      ],
      [
        ". Open the event workspace when you need seating, check-in, files, or the event status dashboard.",
        ". Ouvrez l’espace événement si vous avez besoin du placement, de l’accueil, des fichiers ou du tableau de bord de l’événement.",
      ],
      [
        ". Download and archive actions still require server-side permission.",
        ". Le téléchargement et l’archivage restent réservés aux rôles autorisés.",
      ],
    ] as const;

    reviewedLabels.forEach(([english, french]) => {
      expect(translateStaticCopy(english, "fr")).toBe(french);
    });
  });

  it("covers representative labels from the 48-surface French QA audit", () => {
    const auditedTranslations = [
      ["Diginoces RSVP", "Réponse Diginoces"],
      [
        "Enter your authenticator code",
        "Saisissez votre code d’authentification",
      ],
      ["Connection required", "Connexion requise"],
      [
        "Apply activity history filters",
        "Appliquer les filtres de l’historique d’activité",
      ],
      ["QR scanning is disabled", "Le scan QR est désactivé"],
      ["No keepsake messages yet", "Aucun message souvenir pour le moment"],
      ["Decision for row", "Décision pour la ligne"],
      [
        "Ratings help the team understand what went well and what needs improvement.",
        "Les évaluations aident l’équipe à comprendre ce qui a bien fonctionné et ce qui doit être amélioré.",
      ],
      [
        "Visible to authorized Diginoces users only.",
        "Visible uniquement par les utilisateurs Diginoces autorisés.",
      ],
      ["Displays the mobile sidebar.", "Affiche la barre latérale mobile."],
      ["Tables", "Tables"],
    ] as const;

    auditedTranslations.forEach(([english, french]) => {
      expect(translateStaticCopy(english, "fr")).toBe(french);
    });
  });

  it("treats case variations as custom copy unless explicitly mapped", () => {
    expect(translateStaticCopy("guest list", "fr")).toBe("guest list");
    expect(hasStaticTranslation("guest list")).toBe(false);
  });

  it("keeps exact French translations unique for reverse lookups", () => {
    const integrity = getStaticTranslationIntegritySummary();

    expect(integrity.uniqueExactFrenchValueCount).toBe(
      integrity.exactFrenchValueCount,
    );
  });

  it("uses a browser-safe html lang tag for English", () => {
    expect(getLanguageHtmlLang("fr")).toBe("fr");
    expect(getLanguageHtmlLang("en")).toBe("en-US");
  });

  it("rejects invalid localized dates before formatting", () => {
    expect(() => formatLocalizedDate("not-a-date", "fr")).toThrow(
      "Invalid localized date value",
    );
  });

  it("formats date-only strings as local calendar dates", () => {
    const originalTimeZone = process.env.TZ;

    process.env.TZ = "America/Los_Angeles";

    try {
      expect(formatLocalizedDate("2026-01-01", "en")).toBe("Jan 1, 2026");
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });

  it("rejects invalid date-only strings without rolling them over", () => {
    expect(() => formatLocalizedDate("2026-02-29", "en")).toThrow(
      "Invalid localized date value",
    );
    expect(formatLocalizedDate("2024-02-29", "en")).toBe("Feb 29, 2024");
  });

  it("keeps home page section arrays aligned across languages", () => {
    expect(homeCopy.fr.audience.items).toHaveLength(
      homeCopy.en.audience.items.length,
    );
    expect(homeCopy.fr.principles.items).toHaveLength(
      homeCopy.en.principles.items.length,
    );
  });
});
