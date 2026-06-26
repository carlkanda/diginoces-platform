import { DEFAULT_LANGUAGE, type SupportedLanguage } from "@/lib/i18n/config";
const baseExactEnglishToFrenchEntries = [
  ["Access action was not completed", "Action d'accès non finalisée"],
  ["Access control", "Gestion des accès"],
  [
    "Access controls will appear after the workspace connection is ready.",
    "Les contrôles d'accès apparaîtront lorsque la connexion de l'espace sera prête.",
  ],
  [
    "Access management is unavailable until the workspace connection is ready.",
    "La gestion des accès est indisponible tant que la connexion de l'espace n'est pas prête.",
  ],
  ["Access updated", "Accès mis à jour"],
  [
    "Active and previously revoked global role assignments.",
    "Attributions de rôles globaux actives ou déjà révoquées.",
  ],
  ["Add event member", "Ajouter un membre à l'événement"],
  [
    "Add ceremonies, receptions, brunches, or other event workspaces inside this wedding.",
    "Ajoutez cérémonies, réceptions, brunchs ou autres espaces événementiels dans ce mariage.",
  ],
  [
    "Add staff accounts that should run or supervise this event.",
    "Ajoutez les comptes équipe qui doivent piloter ou superviser cet événement.",
  ],
  ["Add project member", "Ajouter un membre au mariage"],
  [
    "Add the bride, groom, or operator accounts that should open this wedding.",
    "Ajoutez les comptes mariée, marié ou opérateur qui doivent ouvrir ce mariage.",
  ],
  [
    "Adjust the filters or clear them to see every global access record.",
    "Ajustez les filtres ou effacez-les pour afficher toutes les attributions de rôles globaux.",
  ],
  ["All roles", "Tous les rôles"],
  ["All statuses", "Tous les statuts"],
  ["Approved", "Approuvé"],
  ["Assign global role", "Attribuer un rôle global"],
  [
    "Assign event staff or check-in supervisors who should access this event workspace.",
    "Attribuez l'accès aux équipes événement ou responsables accueil qui doivent ouvrir cet espace événement.",
  ],
  [
    "Assign bride, groom, couple, or project operator access to users who already have a Diginoces login.",
    "Attribuez l'accès mariée, marié, couple ou opérateur aux utilisateurs qui ont déjà un compte Diginoces.",
  ],
  ["Assign role", "Attribuer le rôle"],
  [
    "Assign sensitive platform roles to existing Diginoces users. Wedding and event access stays inside each project or event setup page.",
    "Attribuez les rôles sensibles de la plateforme aux utilisateurs Diginoces existants. Les accès aux mariages et aux événements se gèrent dans leurs pages de configuration respectives.",
  ],
  ["Back to event", "Retour à l'événement"],
  [
    "Check the email and selected role, then try again.",
    "Vérifiez l'e-mail et le rôle sélectionné, puis réessayez.",
  ],
  [
    "Check the entered event details, then try again.",
    "Vérifiez les détails de l'événement, puis réessayez.",
  ],
  [
    "Check the entered setup details, then try again.",
    "Vérifiez les informations de configuration, puis réessayez.",
  ],
  ["Clear", "Effacer"],
  ["Couple and status", "Couple et statut"],
  ["Cancelled", "Annulé"],
  ["Civil", "Civil"],
  ["Completed", "Terminé"],
  ["Create an event", "Créer un événement"],
  ["Create event", "Créer l'événement"],
  ["Customary", "Coutumier"],
  ["End time", "Heure de fin"],
  ["Event operations", "Opérations événement"],
  ["Event access", "Accès à l'événement"],
  ["Event access was updated.", "L'accès à l'événement a été mis à jour."],
  [
    "Event details were saved.",
    "Les détails de l'événement ont été enregistrés.",
  ],
  ["Event identity", "Identité de l'événement"],
  [
    "Event member status was updated.",
    "Le statut du membre événement a été mis à jour.",
  ],
  ["Event role", "Rôle événement"],
  ["Event scoped", "Limité à l'événement"],
  ["Event status", "Statut de l'événement"],
  ["Event type", "Type d'événement"],
  ["Event setup", "Configuration de l'événement"],
  [
    "Event setup controls will appear after the workspace connection is ready.",
    "Les contrôles de configuration événement apparaîtront lorsque la connexion de l'espace sera prête.",
  ],
  [
    "Event setup is unavailable until the workspace connection is ready.",
    "La configuration événement est indisponible tant que la connexion de l'espace n'est pas prête.",
  ],
  [
    "Event setup stays closed until the secure workspace connection is configured.",
    "La configuration événement reste fermée jusqu'à ce que la connexion sécurisée de l'espace soit configurée.",
  ],
  ["Event setup updated", "Configuration événement mise à jour"],
  ["Event setup was not completed", "Configuration événement non finalisée"],
  ["Event was created.", "L'événement a été créé."],
  ["Filter", "Filtrer"],
  ["Filter assignments", "Filtrer les attributions"],
  [
    "Find a user, role, or status before changing access.",
    "Recherchez un utilisateur, un rôle ou un statut avant de modifier les accès.",
  ],
  ["Audit Viewer", "Lecteur d’audit"],
  ["Diginoces Admin", "Admin Diginoces"],
  ["File Manager", "Gestionnaire de fichiers"],
  ["Operations Manager", "Responsable opérations"],
  ["Role Manager", "Gestionnaire de rôles"],
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
  ["Can manage roles and permissions.", "Peut gérer les rôles et permissions."],
  [
    "Manages roles and permissions through approved backend services.",
    "Gère les rôles et permissions via les services backend approuvés.",
  ],
  ["Global role", "Rôle global"],
  [
    "Global role access was revoked.",
    "L'attribution du rôle global a été révoquée.",
  ],
  [
    "Global role access was updated.",
    "L'attribution du rôle global a été mise à jour.",
  ],
  ["Global role assignments", "Attributions de rôles globaux"],
  ["Invited", "Invitation envoyée"],
  ["In progress", "En cours"],
  [
    "Jump directly to the event details or event access area.",
    "Allez directement aux détails de l'événement ou à l'accès événement.",
  ],
  [
    "Jump directly to the part of the wedding setup you need to adjust.",
    "Allez directement à la partie de configuration du mariage à ajuster.",
  ],
  [
    "Keep the couple record, events, and access assignments ready before daily project work begins.",
    "Gardez le dossier couple, les événements et les accès prêts avant le travail quotidien.",
  ],
  [
    "Keep the event schedule, venue, status, and event-day staff access ready for handoff.",
    "Gardez l'horaire, le lieu, le statut et l'accès équipe prêts pour la transmission.",
  ],
  ["Lead", "Prospect"],
  ["MFA required", "MFA requise"],
  ["No event members assigned", "Aucun membre événement attribué"],
  ["No global roles assigned", "Aucun rôle global attribué"],
  ["No matching role assignments", "Aucune attribution de rôle correspondante"],
  ["No project members assigned", "Aucun membre du mariage attribué"],
  ["Other", "Autre"],
  ["Planning notes", "Notes de planification"],
  ["Preferred language", "Langue préférée"],
  ["Primary navigation", "Navigation principale"],
  ["Project access", "Accès au mariage"],
  ["Project access was updated.", "L'accès au mariage a été mis à jour."],
  [
    "Project member status was updated.",
    "Le statut du membre mariage a été mis à jour.",
  ],
  ["Project role", "Rôle mariage"],
  ["Project scoped", "Limité au mariage"],
  [
    "Project setup stays closed until the secure workspace connection is configured.",
    "La configuration du mariage reste fermée jusqu'à ce que la connexion sécurisée de l'espace soit configurée.",
  ],
  ["Project setup", "Paramètres du mariage"],
  ["Project status", "Statut du mariage"],
  ["Public navigation", "Navigation publique"],
  ["Religious", "Religieux"],
  ["Removed", "Retiré"],
  ["Revoke", "Révoquer"],
  ["Revoked", "Révoqué"],
  ["Role assignment", "Attribution de rôle"],
  ["Role filter", "Filtre par rôle"],
  [
    "Role management stays closed until the secure workspace connection is configured.",
    "La gestion des rôles reste fermée jusqu'à ce que la connexion sécurisée de l'espace soit configurée.",
  ],
  ["Save event setup", "Enregistrer la configuration événement"],
  ["Save wedding setup", "Enregistrer la configuration du mariage"],
  ["Search by name or email", "Rechercher par nom ou e-mail"],
  ["Select a global role", "Sélectionner un rôle global"],
  [
    "Setup is unavailable until the workspace connection is ready.",
    "La configuration est indisponible tant que la connexion de l'espace n'est pas prête.",
  ],
  ["Setup action was not completed", "Configuration non finalisée"],
  ["Setup sections", "Sections de configuration"],
  ["Setup updated", "Configuration mise à jour"],
  ["Standard sign-in", "Connexion standard"],
  ["Start time", "Heure de début"],
  ["Status filter", "Filtre par statut"],
  ["Submitted", "Soumis"],
  ["Suspended", "Suspendu"],
  ["Toggle navigation", "Afficher ou masquer la navigation"],
  [
    "The access change could not be completed. Confirm the request is still valid, then try again.",
    "La modification des accès n'a pas pu être effectuée. Vérifiez que la demande est toujours valide, puis réessayez.",
  ],
  [
    "The event setup action could not be completed. Confirm the user exists and the selected role is valid.",
    "L'action de configuration événement n'a pas pu être effectuée. Confirmez que l'utilisateur existe et que le rôle sélectionné est valide.",
  ],
  [
    "The setup action could not be completed. Confirm the user exists and the selected role is valid.",
    "L'action de configuration n'a pas pu être effectuée. Confirmez que l'utilisateur existe et que le rôle sélectionné est valide.",
  ],
  [
    "The user must already be able to sign in.",
    "L'utilisateur doit déjà pouvoir se connecter.",
  ],
  [
    "This account is not allowed to manage global access.",
    "Ce compte n'est pas autorisé à gérer les accès globaux.",
  ],
  [
    "This account is not allowed to perform that event setup action.",
    "Ce compte n'est pas autorisé à effectuer cette action de configuration événement.",
  ],
  [
    "This account is not allowed to perform that setup action.",
    "Ce compte n'est pas autorisé à effectuer cette action de configuration.",
  ],
  [
    "Update the couple record, language, contact details, and project lifecycle status.",
    "Mettez à jour le dossier couple, la langue, les contacts et le statut du mariage.",
  ],
  [
    "Update the event identity, date/time, venue, and lifecycle status.",
    "Mettez à jour l'identité, la date, l'heure, le lieu et le statut de l'événement.",
  ],
  ["User email", "E-mail utilisateur"],
  ["Venue address", "Adresse du lieu"],
  [
    "Use this for Diginoces administrators, operations managers, role managers, and other platform-level roles.",
    "Utilisez ce formulaire pour les administrateurs Diginoces, responsables opérations, gestionnaires de rôles et autres rôles de plateforme.",
  ],
  [
    "Visible only to authorized Diginoces users.",
    "Visible seulement par les utilisateurs Diginoces autorisés.",
  ],
  ["Wedding identity", "Identité du mariage"],
  [
    "Wedding project details were saved.",
    "Les détails du mariage ont été enregistrés.",
  ],
  ["Wedding setup", "Configuration du mariage"],
  [
    "Setup controls will appear after the workspace connection is ready.",
    "Les contrôles de configuration apparaîtront lorsque la connexion de l'espace sera prête.",
  ],
  ["Access setup needed", "Configuration d’accès requise"],
  ["Access stays role-aware", "L’accès reste limité par rôle"],
  ["Access", "Accès"],
  ["Account", "Compte"],
  ["Action", "Action"],
  ["Actions", "Actions"],
  ["Active", "Actif"],
  ["Active guests", "Invités actifs"],
  ["Active payment exceptions", "Exceptions de paiement actives"],
  ["Active tables", "Tables actives"],
  ["Active files", "Fichiers actifs"],
  ["Activity", "Activité"],
  ["Added to guest list", "Ajouté à la liste d’invités"],
  ["Activity trail", "Historique"],
  ["Add guest", "Ajouter un invité"],
  ["Add one guest", "Ajouter un invité manuellement"],
  ["All events", "Tous les événements"],
  ["All sides", "Tous les côtés"],
  ["Approved contracts", "Contrats approuvés"],
  ["Archived files", "Fichiers archivés"],
  [
    "Ask an administrator to finish the workspace connection before requesting access codes.",
    "Demandez à un administrateur de terminer la connexion de l’espace avant de demander des codes d’accès.",
  ],
  ["Approved roles", "Rôles approuvés"],
  ["Audit trail", "Journal d’activité"],
  ["Awaiting RSVP", "RSVP en attente"],
  ["Back to projects", "Retour aux mariages"],
  ["Back to workspace", "Retour à l’espace"],
  ["Best next step", "Meilleure prochaine étape"],
  ["Best place to start", "Meilleur point de départ"],
  ["Both", "Les deux"],
  ["Bride side", "Côté mariée"],
  ["Bride", "Mariée"],
  ["Cannot attend", "Ne peut pas venir"],
  ["Confirmed yes responses.", "Réponses positives confirmées."],
  ["Both sides", "Deux côtés"],
  ["Check your inbox", "Vérifiez votre boîte mail"],
  ["Check-in", "Accueil"],
  ["Clear ownership", "Responsabilités claires"],
  ["Connection pending", "Connexion en attente"],
  ["Command", "Pilotage"],
  ["Commercial", "Contrats et paiements"],
  ["Communication state", "État des messages"],
  ["Communications", "Communications"],
  ["Contact", "Contact"],
  ["Continue", "Continuer"],
  ["Control", "Contrôle"],
  ["Contract", "Contrat"],
  ["Controlled access", "Accès contrôlé"],
  ["Control and evidence", "Contrôle et preuves"],
  ["Couple view", "Vue couple"],
  ["Capacity", "Capacité"],
  ["CSV imports", "Imports CSV"],
  ["CSV only", "CSV uniquement"],
  ["Created", "Créé"],
  ["Current access", "Accès actuel"],
  ["Current focus", "Priorité actuelle"],
  ["Dashboard", "Tableau de bord"],
  ["Dashboard actions", "Actions du tableau de bord"],
  ["Dashboard coverage", "Couverture du tableau de bord"],
  ["Date", "Date"],
  ["Delivered", "Livré"],
  ["Deliver and coordinate", "Livrer et coordonner"],
  ["Digital", "Numérique"],
  ["Digital invitation", "Invitation numérique"],
  ["Diginoces home", "Accueil Diginoces"],
  ["Diginoces workspace", "Espace Diginoces"],
  ["Download", "Télécharger"],
  ["Draft", "Brouillon"],
  ["Archived", "Archivé"],
  ["Email address", "Adresse e-mail"],
  ["Email code", "Code e-mail"],
  ["Enter the code from your email", "Saisissez le code reçu par e-mail"],
  ["English", "Anglais"],
  ["Enter workspace", "Entrer dans l’espace"],
  ["entry points", "points d’entrée"],
  ["Event", "Événement"],
  ["Event dashboard", "Tableau événement"],
  ["Event day", "Jour de l’événement"],
  ["Event assignments", "Affectations événement"],
  ["Event feedback", "Retours événement"],
  ["Event files", "Fichiers événement"],
  ["Event guest management", "Gestion des invités"],
  ["Event invitations", "Invitations par événement"],
  ["Event overview", "Vue événement"],
  ["Event reference", "Référence événement"],
  ["Event dashboards", "Tableaux par événement"],
  ["Events", "Événements"],
  ["Events tracked", "Événements suivis"],
  ["Exception approved", "Exception approuvée"],
  ["Feedback", "Retours"],
  ["Files", "Fichiers"],
  ["Find a wedding", "Trouver un mariage"],
  [
    "Find the right wedding, event, guest, invitation, message, report, or control area without learning the whole navigation first.",
    "Trouvez le bon mariage, événement, invité, invitation, message, rapport ou contrôle sans connaître toute la navigation.",
  ],
  ["French", "Français"],
  ["Guest", "Invité"],
  ["Guest actions", "Actions invité"],
  ["Guest book", "Livre d’or"],
  ["Guest imports", "Imports invités"],
  ["Guest list", "Liste d’invités"],
  ["Guest page access", "Accès page invité"],
  ["Guest page preview", "Aperçu page invité"],
  ["Guest is active", "Invité actif"],
  ["Guest message", "Message invité"],
  ["Guest side", "Côté invité"],
  ["Guest types", "Types d’invités"],
  ["Has space", "Places disponibles"],
  ["Guests", "Invités"],
  ["Guests invited to events", "Invités affectés aux événements"],
  [
    "Guests who may need a final check.",
    "Invités qui peuvent nécessiter une dernière vérification.",
  ],
  ["Guests who replied no.", "Invités ayant répondu non."],
  ["Groom side", "Côté marié"],
  ["Groom", "Marié"],
  ["Help", "Aide"],
  ["How access works", "Fonctionnement de l’accès"],
  ["Import history", "Historique des imports"],
  ["Import", "Import"],
  ["Import summary", "Résumé des imports"],
  ["Imports", "Imports"],
  ["In preparation", "En préparation"],
  ["Inside a guest record", "Dans une fiche invité"],
  ["Inside a project", "Dans un projet"],
  ["Inside a wedding", "Dans un mariage"],
  ["Inside an event", "Dans un événement"],
  ["Inside project or event", "Dans un mariage ou événement"],
  ["Invitation work can begin", "Les invitations peuvent commencer"],
  ["Invitations", "Invitations"],
  ["Language", "Langue"],
  ["Language not set", "Langue non définie"],
  ["Latest movement", "Dernière activité"],
  ["Last update", "Dernière mise à jour"],
  ["Locked", "Verrouillé"],
  ["Manual WhatsApp workflow", "Flux WhatsApp manuel"],
  ["Manage partners", "Gérer les partenaires"],
  ["Maybe", "Peut-être"],
  ["Messages", "Messages"],
  ["Messages ready to send", "Messages prêts à envoyer"],
  ["Message context", "Contexte du message"],
  ["Message context sources", "Sources du contexte du message"],
  ["Message history", "Historique des messages"],
  ["Message queue", "File des messages"],
  ["Message purpose", "Objectif du message"],
  ["Message type", "Type de message"],
  ["Queue guidance", "Aide file d’envoi"],
  ["Sending rhythm guidance", "Aide rythme d’envoi"],
  ["Next step", "Prochaine étape"],
  ["No guests match this view", "Aucun invité ne correspond à cette vue"],
  ["No imports yet", "Aucun import pour le moment"],
  ["No matching workspace area", "Aucune zone trouvée"],
  ["No messages waiting", "Aucun message en attente"],
  ["No messages ready", "Aucun message prêt"],
  ["No team notes", "Aucune note équipe"],
  ["No review queue", "Aucune file de revue"],
  ["No workspace areas yet", "Aucun espace disponible"],
  ["Not set", "Non défini"],
  ["Not scheduled", "Non planifié"],
  ["Not Started", "Non commencé"],
  ["Planning readiness", "Préparation du placement"],
  ["Occupancy", "Occupation"],
  ["Open", "Ouvrir"],
  ["Open a wedding", "Ouvrez un mariage"],
  ["Open dashboard", "Ouvrir le tableau de bord"],
  ["Open guest list", "Ouvrir la liste d’invités"],
  ["Open partner dashboard", "Ouvrir l’espace partenaire"],
  ["Open project", "Ouvrir le projet"],
  ["Open queue", "Ouvrir la file"],
  ["Open directly", "Ouvrir directement"],
  ["Open WhatsApp", "Ouvrir WhatsApp"],
  ["Open wedding projects", "Ouvrir les mariages"],
  ["Open workspace", "Ouvrir l’espace"],
  ["Operational", "Opérationnel"],
  ["Operations dashboard", "Tableau des opérations"],
  ["Operations area", "Zone opérations"],
  ["Operations view", "Vue opérations"],
  ["Partner workspace", "Espace partenaire"],
  ["Partners", "Partenaires"],
  ["Package", "Forfait"],
  ["Payments", "Paiements"],
  ["Permission-scoped workspace", "Espace limité par permissions"],
  ["Plan and review", "Planifier et revoir"],
  ["Plan the wedding", "Planifier le mariage"],
  ["Print handoff", "Transmission impression"],
  ["Public guest page link", "Lien de page invitée publique"],
  ["Primary contact", "Contact principal"],
  ["Pricing", "Tarification"],
  ["Printed invitation", "Invitation imprimée"],
  ["Printed only", "Imprimé seulement"],
  ["Project", "Projet"],
  ["Project channel", "Canal projet"],
  ["Project comments", "Commentaires du projet"],
  ["Project dashboard", "Tableau du projet"],
  ["Project context", "Contexte du projet"],
  ["Project desk summary", "Résumé des mariages"],
  ["Project overview", "Vue du projet"],
  ["Project reference", "Référence mariage"],
  ["Project thread", "Fil du projet"],
  ["Project visibility", "Visibilité des mariages"],
  ["Projects", "Projets"],
  ["Prepare guests", "Préparer les invités"],
  ["Prepare the guest journey", "Préparer le parcours invité"],
  ["Quick actions", "Actions rapides"],
  ["Quick action guidance", "Aide actions rapides"],
  ["Protected actions", "Actions protégées"],
  ["Protected area", "Zone protégée"],
  ["protected", "protégé"],
  ["Ready", "Prêt"],
  ["Queue", "File"],
  ["Queue health", "État de la file"],
  ["Ready for daily work", "Prêt pour le travail quotidien"],
  [
    "Ready for the next wedding task",
    "Prêt pour la prochaine tâche du mariage",
  ],
  ["Ready for review", "Prêt pour revue"],
  ["Readiness tasks", "Tâches de préparation"],
  ["Reception", "Réception"],
  ["Recorded arrivals", "Arrivées enregistrées"],
  ["Reports", "Rapports"],
  ["Report catalog", "Catalogue des rapports"],
  ["Report export is ready", "L’export de rapport est prêt"],
  [
    "Report export needs attention",
    "L’export de rapport demande une attention",
  ],
  ["Available reports", "Rapports disponibles"],
  ["Ready in this context", "Disponible dans ce contexte"],
  ["Event reporting context", "Contexte de rapport événement"],
  ["Wedding reporting context", "Contexte de rapport mariage"],
  ["File activity", "Activité des fichiers"],
  ["Create a CSV", "Créer un CSV"],
  ["Start date", "Date de début"],
  ["Review and control", "Revoir et contrôler"],
  ["Review needed", "Revue nécessaire"],
  ["Review rules", "Règles de revue"],
  ["Review state", "État de revue"],
  ["Review first", "Revoir d’abord"],
  ["Review", "Revue"],
  ["Review reports", "Consulter les rapports"],
  ["Review before apply", "Revoir avant d’ajouter"],
  ["Role", "Rôle"],
  ["Role-aware navigation", "Navigation par rôle"],
  ["Role-aware project view", "Vue projet selon le rôle"],
  ["RSVP", "RSVP"],
  ["Responses by event", "Réponses par événement"],
  ["Scheduled", "Planifié"],
  ["Seating", "Placement"],
  ["Seating map", "Plan de salle"],
  ["Secure access", "Accès sécurisé"],
  ["Search Diginoces", "Rechercher dans Diginoces"],
  ["Search", "Rechercher"],
  ["Search workspace", "Rechercher dans l'espace de travail"],
  ["Seats assigned", "Places attribuées"],
  ["Search wedding operations...", "Rechercher dans les opérations..."],
  ["Save guest", "Enregistrer l’invité"],
  ["Send email code", "Envoyer le code e-mail"],
  ["Sending", "Envoi"],
  ["Sending...", "Envoi..."],
  ["Sign in", "Se connecter"],
  [
    "Sign in to the Diginoces workspace.",
    "Connectez-vous à l’espace Diginoces.",
  ],
  ["Sign-in needs attention", "La connexion demande une attention"],
  ["Sign out", "Se déconnecter"],
  ["Signed in as", "Connecté en tant que"],
  ["Six-digit code", "Code à six chiffres"],
  ["Signals available", "Signaux disponibles"],
  ["Before the event", "Avant l’événement"],
  ["available", "disponible"],
  [
    "Event access controls this workspace",
    "L’accès à l’événement contrôle cet espace",
  ],
  ["Event details", "Détails de l’événement"],
  ["Event snapshot", "Vue d’ensemble de l’événement"],
  ["Reception event", "Événement réception"],
  ["Review files", "Revoir les fichiers"],
  ["Run check-in", "Piloter l’accueil"],
  ["Run this event", "Piloter cet événement"],
  ["Plan seating", "Préparer le placement"],
  ["When it matters", "Quand c’est important"],
  ["Status", "Statut"],
  ["Start with the next action", "Commencer par la prochaine action"],
  ["Suggested next step", "Prochaine étape suggérée"],
  ["Team access", "Accès équipe"],
  ["Team review", "Revue équipe"],
  ["CSV versions", "Versions CSV"],
  ["Assignment mode", "Mode d’affectation"],
  ["Capacity per table", "Capacité par table"],
  ["Code prefix", "Préfixe code"],
  ["Display order", "Ordre d’affichage"],
  ["Name prefix", "Préfixe nom"],
  ["Number of tables", "Nombre de tables"],
  ["Seat-level", "Par siège"],
  ["Table code", "Code table"],
  ["Table name", "Nom de table"],
  ["Table plan", "Plan des tables"],
  ["Tables needing attention", "Tables à vérifier"],
  ["Table-level", "Par table"],
  ["Team notes", "Notes équipe"],
  ["Add a project update", "Ajouter une mise à jour"],
  ["Comment details", "Détails du commentaire"],
  ["Communication and status", "Communication et statut"],
  ["Confirmed payments", "Paiements confirmés"],
  ["Couple review", "Revue couple"],
  ["Decision queue", "File de décision"],
  ["Events and organization", "Événements et organisation"],
  ["Export history", "Historique des exports"],
  [
    "Export only approved messages",
    "Exporter uniquement les messages approuvés",
  ],
  ["Feedback review desk", "Bureau de revue des retours"],
  ["Keep notes factual", "Garder des notes factuelles"],
  ["Keepsake messages", "Messages souvenir"],
  ["Latest contract", "Dernier contrat"],
  ["Messages to send", "Messages à envoyer"],
  ["Not Generated", "Non générée"],
  ["Optional details", "Détails facultatifs"],
  ["Overall event experience", "Expérience globale de l’événement"],
  ["Pending review", "Revue en attente"],
  ["Pending Review", "Décision en attente"],
  ["Post-event review", "Revue après événement"],
  ["Prepare design handoff", "Préparer la transmission design"],
  ["Prepare keepsake CSV", "Préparer le CSV souvenir"],
  ["Prepare message", "Préparer le message"],
  ["Prepare one guest message", "Préparer un message invité"],
  ["Prepared history", "Historique préparé"],
  ["Prepared message history", "Historique des messages préparés"],
  ["Preview guest page", "Aperçu de la page invitée"],
  ["Recent message records", "Messages récents"],
  ["Review event fit", "Revoir la cohérence événement"],
  ["Title or guest type", "Titre ou type d’invité"],
  ["Waiting review", "En attente de décision"],
  ["Waiting for review", "À relire"],
  ["This event", "Cet événement"],
  ["This wedding", "Ce mariage"],
  ["Task", "Tâche"],
  ["Traceable decisions", "Décisions traçables"],
  ["Toggle Sidebar", "Afficher ou masquer le panneau de navigation"],
  ["Breadcrumb", "Fil d'Ariane"],
  ["Upload CSV", "Importer un CSV"],
  ["Use", "Utilité"],
  ["Use a different email", "Utiliser une autre adresse"],
  ["Venue", "Lieu"],
  ["View contract", "Voir le contrat"],
  ["Verify email code", "Vérifier le code e-mail"],
  ["Verifying...", "Vérification..."],
  ["Venue not set", "Lieu non défini"],
  ["Wedding", "Mariage"],
  ["Wedding operating map", "Carte de travail du mariage"],
  ["Wedding operations", "Opérations de mariage"],
  ["Wedding map guidance", "Aide carte du mariage"],
  ["Wedding project desk", "Bureau des mariages"],
  ["Wedding project details", "Détails du mariage"],
  ["Wedding projects", "Projets de mariage"],
  ["Wedding record", "Dossier mariage"],
  ["Wedding records", "Dossiers mariage"],
  ["Wedding workstreams", "Flux de travail mariage"],
  ["Weddings", "Mariages"],
  ["WhatsApp sending stays manual", "L’envoi WhatsApp reste manuel"],
  ["Workspace", "Espace de travail"],
  ["Workspace access", "Accès à l’espace"],
  ["Work area", "Zone de travail"],
  ["Work area guidance", "Aide zones de travail"],
  ["Work areas", "Zones de travail"],
  ["work areas", "zones de travail"],
  ["Workspace connection required", "Connexion de l’espace requise"],
  ["Workspace connection pending", "Connexion de l’espace en attente"],
  ["Workspace ready", "Espace prêt"],
  ["Yes", "Oui"],
  ["Your wedding projects", "Vos mariages"],
  ["View operations dashboard", "Voir le tableau des opérations"],
  ["Confirmed payment total", "Total des paiements confirmés"],
  ["No deadline set", "Aucune échéance définie"],
  ["Access readiness", "Préparation de l’accès"],
  ["Save selection", "Enregistrer la sélection"],
  ["No estimate yet", "Aucune estimation pour le moment"],
  ["Wedding context", "Contexte du mariage"],
  ["Expected amount", "Montant attendu"],
  ["File register", "Registre des fichiers"],
  ["Import file", "Fichier d’import"],
  ["Report export", "Export de rapport"],
  ["Partner document", "Document partenaire"],
  ["Partner details", "Détails du partenaire"],
  ["Partner network", "Réseau de partenaires"],
  ["Partner profile", "Profil partenaire"],
  ["Partner type", "Type de partenaire"],
  [
    "Partner work stays under Diginoces control",
    "Le travail partenaire reste sous contrôle Diginoces",
  ],
  [
    "Partner records are not connected",
    "Les dossiers partenaires ne sont pas connectés",
  ],
  ["Partner project review", "Revue des projets partenaires"],
  ["Partner-visible updates", "Mises à jour visibles par les partenaires"],
  ["File", "Fichier"],
  ["Register a protected file", "Enregistrer un fichier protégé"],
  ["File details", "Détails du fichier"],
  ["Select file", "Sélectionner un fichier"],
  ["File name", "Nom du fichier"],
  ["File format", "Format du fichier"],
  ["Register file", "Enregistrer le fichier"],
  ["Vault snapshot", "Vue du coffre"],
  [
    "What is live in this wedding right now.",
    "Ce qui est actif dans ce mariage en ce moment.",
  ],
  ["Not required", "Non requis"],
  ["Record lifecycle decision", "Enregistrer la décision de cycle de vie"],
  [
    "Explain why this retention action is being recorded.",
    "Expliquez pourquoi cette action de conservation est enregistrée.",
  ],
  ["Save decision", "Enregistrer la décision"],
  [
    "Rows that need correction before use.",
    "Lignes à corriger avant utilisation.",
  ],
  ["CSV file", "Fichier CSV"],
  ["What happens next", "Ce qui se passe ensuite"],
  ["Source file handling", "Gestion du fichier source"],
  ["Before saving", "Avant l’enregistrement"],
  ["Available setup", "Configuration disponible"],
  ["Check digital readiness", "Vérifier la préparation numérique"],
  ["Available downloads", "Téléchargements disponibles"],
  ["Not submitted", "Non envoyé"],
  ["Template library", "Bibliothèque de modèles"],
  ["Template details", "Détails du modèle"],
  ["Template version", "Version du modèle"],
  ["Template", "Modèle"],
  ["Available recipients", "Destinataires disponibles"],
  ["Eligible for keepsake work", "Éligible au travail souvenir"],
  ["Protect the keepsake", "Protéger le souvenir"],
  ["No export", "Aucun export"],
  ["Approve", "Approuver"],
  ["Export readiness", "Préparation de l’export"],
  ["Not prepared", "Non préparé"],
  ["No rows", "Aucune ligne"],
  ["No export prepared", "Aucun export préparé"],
  ["Sent back to the team", "Renvoyé à l’équipe"],
  ["Left out of the keepsake", "Exclu du souvenir"],
  ["Approve what feels right", "Approuver ce qui convient"],
  [
    "Couple decisions shape the final keepsake",
    "Les décisions du couple façonnent le souvenir final",
  ],
  ["Comments", "Commentaires"],
  ["Comment", "Commentaire"],
  ["Post comment", "Publier le commentaire"],
  ["Partner visible", "Visible par les partenaires"],
  ["Submit feedback", "Envoyer le retour"],
  ["No feedback yet", "Aucun retour pour le moment"],
  ["No response", "Aucune réponse"],
  ["Not rated", "Non noté"],
  ["Workspace reporting context", "Contexte de rapport de l’espace"],
  ["Scoped reports", "Rapports ciblés"],
  [
    "Reports follow your current access",
    "Les rapports suivent votre accès actuel",
  ],
  ["Report", "Rapport"],
  ["Project guest summary", "Résumé des invités du mariage"],
  ["RSVP attendance summary", "Résumé de présence RSVP"],
  ["Seating summary", "Résumé du placement"],
  ["Check-in summary", "Résumé de l’accueil"],
  ["Commercial access summary", "Résumé de l’accès commercial"],
  ["Export", "Export"],
  ["Global workspace", "Espace global"],
  ["Manager access", "Accès responsable"],
  ["Read access", "Accès lecture"],
  ["Available actions", "Actions disponibles"],
  ["Access added later", "Accès ajouté plus tard"],
  ["Active profiles", "Profils actifs"],
  ["Pending profiles", "Profils en attente"],
  ["Workspace signals", "Signaux de l’espace"],
  ["Current value", "Valeur actuelle"],
  ["Upcoming events", "Événements à venir"],
  ["Active projects", "Mariages actifs"],
  ["Pending contracts", "Contrats en attente"],
  ["Confirmed payment volume", "Volume de paiements confirmés"],
  ["Imports needing review", "Imports à revoir"],
  ["Messages needing action", "Messages à traiter"],
  ["Unexpected guest requests", "Demandes d’invités imprévus"],
  ["Draft events", "Événements brouillons"],
  ["Source", "Origine"],
  ["Rows", "Lignes"],
  ["Wedding project", "Projet de mariage"],
  ["Guest Public Pages Previewed", "Aperçus de pages invitées publiques"],
  ["Guest Public Tokens Update", "Mise à jour des jetons de pages invitées"],
  [
    "Review queue, Partner dashboard, Create partner",
    "File de revue, espace partenaire, création de partenaire",
  ],
  ["Activity entries", "Entrées d’activité"],
  [
    "Activity export needs attention",
    "L’export d’activité nécessite une attention",
  ],
  ["Activity export was created", "L’export d’activité a été créé"],
  [
    "Activity history is waiting for workspace access",
    "L’historique attend l’accès à l’espace",
  ],
  [
    "Activity records are operational evidence",
    "Les dossiers d’activité servent de preuve opérationnelle",
  ],
  ["Export access", "Accès à l’export"],
  ["Export access is restricted", "L’accès à l’export est limité"],
  ["Export filtered activity", "Exporter l’activité filtrée"],
  ["Export filtered CSV", "Exporter le CSV filtré"],
  ["Event notes", "Notes événement"],
  ["Guest data", "Données invitées"],
  ["Partner notes", "Notes partenaire"],
  ["Planning details", "Détails de planification"],
  ["Recent activity", "Activité récente"],
  ["Refresh workspace", "Actualiser l’espace"],
  [
    "Reports are waiting for workspace access",
    "Les rapports attendent l’accès à l’espace",
  ],
  ["Return to workspace", "Revenir à l’espace"],
  [
    "Review decisions affect project access",
    "Les décisions de revue modifient l’accès au mariage",
  ],
  ["Review queue is not connected", "La file de revue n’est pas connectée"],
  ["Search activity", "Rechercher dans l’activité"],
  ["Send for review", "Envoyer en revue"],
  ["Sensitive details redacted", "Détails sensibles expurgés"],
  ["Team-only access", "Accès réservé à l’équipe"],
  [
    "Two-step verification is not ready",
    "La vérification en deux étapes n’est pas prête",
  ],
  ["Use project pages for action", "Utilisez les pages mariage pour agir"],
  ["Verification status unavailable", "Statut de vérification indisponible"],
  ["Wedding year", "Année du mariage"],
  [
    "No assigned wedding activity yet",
    "Aucune activité de mariage assigné pour le moment",
  ],
  ["No partner profiles visible", "Aucun profil partenaire visible"],
  [
    "Access checks will appear after this file is requested or downloaded.",
    "Les contrôles d’accès apparaîtront après demande ou téléchargement de ce fichier.",
  ],
  ["Access conditions", "Conditions d’accès"],
  ["Access end date", "Date de fin d’accès"],
  ["Access exception", "Exception d’accès"],
  ["Access history", "Historique d’accès"],
  [
    "Active packages and add-ons available to the wedding.",
    "Forfaits et options actifs disponibles pour ce mariage.",
  ],
  [
    "Active stations, offline state, and recent check-in activity.",
    "Postes actifs, état hors ligne et activité d’accueil récente.",
  ],
  [
    "Add a reusable package for event pricing.",
    "Ajoutez un forfait réutilisable pour la tarification événement.",
  ],
  [
    "Add a station when the event team has a dedicated check-in device.",
    "Ajoutez un poste lorsque l’équipe événement dispose d’un appareil dédié à l’accueil.",
  ],
  [
    "Add at least one event and one active service package, or ask an authorized Diginoces user to manage pricing.",
    "Ajoutez au moins un événement et un forfait actif, ou demandez à un utilisateur Diginoces autorisé de gérer la tarification.",
  ],
  [
    "Add at least one event and one guest before preparing a WhatsApp message.",
    "Ajoutez au moins un événement et un invité avant de préparer un message WhatsApp.",
  ],
  [
    "Add only approved rows to the guest list.",
    "Ajoutez uniquement les lignes approuvées à la liste d’invités.",
  ],
  [
    "Add optional services that can be selected for events.",
    "Ajoutez les services optionnels sélectionnables pour les événements.",
  ],
  [
    "Add the first update when there is a partner question, review note, or decision that should stay with this wedding.",
    "Ajoutez la première mise à jour lorsqu’une question partenaire, note de revue ou décision doit rester avec ce mariage.",
  ],
  ["Addendum details", "Détails de l’avenant"],
  ["Add-on details", "Détails de l’option"],
  [
    "Adjust the search filters or create an unexpected guest request if the person is not on the list.",
    "Ajustez les filtres de recherche ou créez une demande d’invité imprévu si la personne n’est pas dans la liste.",
  ],
  ["All active guests are seated", "Tous les invités actifs sont placés"],
  [
    "Allow Diginoces to review this testimonial for public use",
    "Autoriser Diginoces à revoir ce témoignage pour usage public",
  ],
  ["Allowed check-in methods", "Méthodes d’accueil autorisées"],
  ["Approval", "Approbation"],
  ["Approval confirmation", "Confirmation d’approbation"],
  [
    "Approval is recorded in the audit trail and opens the commercial path for guest-list access.",
    "L’approbation est enregistrée dans l’historique et ouvre le parcours commercial d’accès à la liste d’invités.",
  ],
  ["Approve contract", "Approuver le contrat"],
  [
    "Approve only submissions that are ready to move into Diginoces operations. Use requested changes when the partner should correct details first.",
    "Approuvez seulement les soumissions prêtes à passer aux opérations Diginoces. Demandez des changements lorsque le partenaire doit d’abord corriger les détails.",
  ],
  [
    "Approve temporary guest-facing access before payment is complete.",
    "Approuver un accès invité temporaire avant paiement complet.",
  ],
  [
    "Approved guest wishes will appear after this environment is connected to Diginoces access services.",
    "Les vœux invités approuvés apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Approved wishes and export tools will appear after this environment is connected to Diginoces access services.",
    "Les vœux approuvés et outils d’export apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Archive events will appear after lifecycle actions are applied.",
    "Les événements d’archive apparaîtront après application des actions de cycle de vie.",
  ],
  ["Archive project files", "Archiver les fichiers du mariage"],
  ["Assign a guest", "Affecter un invité"],
  ["Assignment details", "Détails de l’affectation"],
  ["Base plus guests", "Base plus invités"],
  ["Cancel pending deletion", "Annuler la suppression en attente"],
  ["Check rows.", "Vérifiez les lignes."],
  [
    "Check-in action could not be completed",
    "L’action d’accueil n’a pas pu être terminée",
  ],
  ["Check-in is closed", "L’accueil est fermé"],
  ["Check-in settings", "Paramètres d’accueil"],
  [
    "Check-in tools will appear after the secure connection is ready.",
    "Les outils d’accueil apparaîtront lorsque la connexion sécurisée sera prête.",
  ],
  ["Choose language", "Choisir la langue"],
  [
    "Column matching will be available after this environment is connected to Diginoces access services.",
    "La correspondance des colonnes sera disponible après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Commercial controls are unavailable",
    "Les contrôles commerciaux sont indisponibles",
  ],
  ["Commercial state", "État commercial"],
  [
    "Communication history will appear after this environment is connected to Diginoces access services.",
    "L’historique des communications apparaîtra après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  ["Confirm check-in", "Confirmer l’accueil"],
  ["Confirm this payment immediately", "Confirmer ce paiement immédiatement"],
  [
    "Connect the workspace before loading arrival tools.",
    "Connectez l’espace avant de charger les outils d’arrivée.",
  ],
  [
    "Connect the workspace before loading scan controls.",
    "Connectez l’espace avant de charger les contrôles de scan.",
  ],
  [
    "Connect the workspace before loading table placement.",
    "Connectez l’espace avant de charger le placement des tables.",
  ],
  [
    "Connect the workspace before loading table plans and assignments.",
    "Connectez l’espace avant de charger les plans de table et affectations.",
  ],
  [
    "Contact your Diginoces host if you need the invitation link to be shared again.",
    "Contactez votre hôte Diginoces si le lien d’invitation doit être partagé à nouveau.",
  ],
  [
    "Contract changes will appear here after they are recorded.",
    "Les changements de contrat apparaîtront ici après enregistrement.",
  ],
  [
    "Contract, pricing, and payment records will appear after the workspace connection is ready.",
    "Les dossiers de contrat, tarification et paiement apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Control when arrivals can be recorded and which methods event staff may use.",
    "Contrôlez quand les arrivées peuvent être enregistrées et quelles méthodes l’équipe événement peut utiliser.",
  ],
  ["Couple approval", "Approbation du couple"],
  ["Couple feedback form", "Formulaire de retour du couple"],
  [
    "Couple review is not connected for this workspace yet.",
    "La revue couple n’est pas encore connectée pour cet espace.",
  ],
  [
    "Create a check-in QR reference for a guest.",
    "Créer une référence QR d’accueil pour un invité.",
  ],
  ["Create addendum", "Créer un avenant"],
  ["Create add-on", "Créer une option"],
  ["Create package", "Créer un forfait"],
  ["Create preload", "Créer un préchargement"],
  ["Create reference", "Créer une référence"],
  ["Create request", "Créer une demande"],
  [
    "Create reusable wording so operations can prepare guest messages without rewriting the same text each time.",
    "Créez des textes réutilisables afin que les opérations préparent les messages invités sans tout réécrire.",
  ],
  ["Create service package", "Créer un forfait de service"],
  [
    "Create tables before assigning guests or generating table cards.",
    "Créez les tables avant d’affecter des invités ou générer des cartons de table.",
  ],
  [
    "Cross-wedding signals will appear after the workspace connection is ready.",
    "Les signaux entre mariages apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  ["CSV source", "Source CSV"],
  [
    "Current responses do not require team review or guest reply follow-up.",
    "Les réponses actuelles ne nécessitent pas de revue équipe ni de relance invité.",
  ],
  [
    "Dashboard data is not requested until Supabase credentials are configured.",
    "Les données du tableau de bord ne sont pas demandées tant que les identifiants Supabase ne sont pas configurés.",
  ],
  [
    "Dashboard data stays closed until the secure workspace connection is available.",
    "Les données du tableau de bord restent fermées jusqu’à disponibilité de la connexion sécurisée.",
  ],
  ["Design records are event-scoped", "Les designs sont limités à l’événement"],
  ["Design workspace", "Espace design"],
  ["Device details", "Détails de l’appareil"],
  [
    "Diginoces keeps invitation design records closed until it can confirm workspace access.",
    "Diginoces garde les dossiers de design d’invitation fermés jusqu’à confirmation de l’accès à l’espace.",
  ],
  [
    "Disabled methods remain unavailable even when the event is open.",
    "Les méthodes désactivées restent indisponibles même lorsque l’événement est ouvert.",
  ],
  ["Dynamic field placement", "Placement des champs dynamiques"],
  ["Edit guest", "Modifier l’invité"],
  [
    "Event and guest setup is needed",
    "La configuration événement et invité est nécessaire",
  ],
  ["Event check-in controls", "Contrôles d’accueil de l’événement"],
  [
    "Event dashboard is waiting for access",
    "Le tableau événement attend l’accès",
  ],
  [
    "Event data stays closed until the secure workspace connection is available.",
    "Les données événement restent fermées jusqu’à disponibilité de la connexion sécurisée.",
  ],
  [
    "Event file handoff is waiting for access",
    "La transmission des fichiers événement attend l’accès",
  ],
  [
    "Event file records stay closed until the secure workspace connection is available.",
    "Les dossiers fichiers événement restent fermés jusqu’à disponibilité de la connexion sécurisée.",
  ],
  [
    "Event invitation tools will appear after the secure workspace connection is ready.",
    "Les outils d’invitation événement apparaîtront lorsque la connexion sécurisée sera prête.",
  ],
  [
    "Event metrics will appear after the workspace connection is ready.",
    "Les métriques événement apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Event package selections will appear after events are added to the wedding.",
    "Les sélections de forfait événement apparaîtront après ajout des événements au mariage.",
  ],
  ["Event seating", "Placement événement"],
  [
    "Event workspace is waiting for access",
    "L’espace événement attend l’accès",
  ],
  [
    "Event-level tasks that keep this event ready for handoff and event-day work.",
    "Tâches événement qui gardent cet événement prêt pour transmission et travail du jour J.",
  ],
  [
    "Export history for this event table-card handoff.",
    "Historique d’export pour la transmission des cartons de table de cet événement.",
  ],
  ["Extra guest price in cents", "Prix invité supplémentaire en centimes"],
  [
    "Field placement, preview approval, and generated invitation files stay closed until Diginoces can confirm workspace access.",
    "Le placement des champs, l’approbation de l’aperçu et les invitations générées restent fermés jusqu’à confirmation de l’accès à l’espace.",
  ],
  ["File record", "Dossier fichier"],
  ["File record is unavailable", "Le dossier fichier est indisponible"],
  [
    "File records will appear after the workspace connection is ready.",
    "Les dossiers fichiers apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  ["File vault", "Coffre-fort fichiers"],
  ["Find guest by QR reference", "Trouver un invité par référence QR"],
  [
    "Generate a contract when the package selections, pricing estimate, and access decision are ready for review.",
    "Générez un contrat lorsque les forfaits, l’estimation tarifaire et la décision d’accès sont prêts pour revue.",
  ],
  [
    "Generate a CSV handoff after the table plan has been reviewed.",
    "Générez une transmission CSV après revue du plan de table.",
  ],
  [
    "Generate a placement preview first. Guest invitation files should be produced only after that preview is approved.",
    "Générez d’abord un aperçu de placement. Les fichiers invités ne doivent être produits qu’après approbation de cet aperçu.",
  ],
  [
    "Generate a technical preview, inspect field placement, then approve the design before preparing guest files.",
    "Générez un aperçu technique, inspectez le placement des champs, puis approuvez le design avant de préparer les fichiers invités.",
  ],
  [
    "Generate and approve the project-level contract for the selected wedding services.",
    "Générez et approuvez le contrat du mariage pour les services sélectionnés.",
  ],
  [
    "Generate operational CSV exports from the reporting catalog your role can access. Each export is scoped to the current workspace, wedding, or event context.",
    "Générez des exports CSV opérationnels depuis le catalogue de rapports accessible à votre rôle. Chaque export est limité au contexte actuel de l’espace, du mariage ou de l’événement.",
  ],
  ["Generate project contract", "Générer le contrat du mariage"],
  [
    "Generate the handoff when the seating plan is ready for table-card preparation.",
    "Générez la transmission lorsque le plan de table est prêt pour préparer les cartons de table.",
  ],
  [
    "Generated guest invitation records will appear here after an approved preview is used for this event.",
    "Les dossiers d’invitation invités générés apparaîtront ici après utilisation d’un aperçu approuvé pour cet événement.",
  ],
  ["Guest count review needed", "Revue du nombre d’invités nécessaire"],
  [
    "Guest creation will be available after the workspace is connected to Diginoces access services.",
    "La création d’invités sera disponible après connexion de l’espace aux services d’accès Diginoces.",
  ],
  ["Guest import history", "Historique des imports invités"],
  ["Guest is ready for check-in", "L’invité est prêt pour l’accueil"],
  ["Guest list impact", "Impact sur la liste d’invités"],
  ["Guest list locked", "Liste d’invités verrouillée"],
  [
    "Guest list upload will be available after this environment is connected to Diginoces access services.",
    "L’import de liste d’invités sera disponible après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Guest management will appear here once the workspace connection is ready.",
    "La gestion des invités apparaîtra ici lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Guest name and title/type are checked during preview validation. Digital invitation rows also need usable WhatsApp information unless they are marked printed-only.",
    "Le nom et le titre/type de l’invité sont vérifiés pendant la validation. Les lignes numériques nécessitent aussi des informations WhatsApp utilisables sauf si elles sont marquées imprimées uniquement.",
  ],
  ["Guest not found", "Invité introuvable"],
  [
    "Choose a report that matches the current scope. Wedding and event reports unlock when this page is opened from the matching workspace.",
    "Choisissez un rapport qui correspond au périmètre actuel. Les rapports mariage et événement se déverrouillent quand cette page est ouverte depuis l’espace correspondant.",
  ],
  [
    "Guest profiles will be editable after the workspace is connected to Diginoces access services.",
    "Les fiches invitées seront modifiables après connexion de l’espace aux services d’accès Diginoces.",
  ],
  ["Guest reference", "Référence invité"],
  ["Guest request", "Demande invité"],
  ["Guest-book approval", "Approbation du livre d’or"],
  [
    "Guest-book tools are not connected for this workspace yet.",
    "Les outils de livre d’or ne sont pas encore connectés pour cet espace.",
  ],
  [
    "Guests who declined are excluded from active seating.",
    "Les invités ayant refusé sont exclus du placement actif.",
  ],
  [
    "I have reviewed this contract and approve it in Diginoces.",
    "J’ai revu ce contrat et je l’approuve dans Diginoces.",
  ],
  ["Import review", "Revue d’import"],
  ["Import side", "Côté de l’import"],
  ["Included guests", "Invités inclus"],
  [
    "Invitation design is waiting for access",
    "Le design d’invitation attend l’accès",
  ],
  [
    "Invitation designs are waiting for access",
    "Les designs d’invitation attendent l’accès",
  ],
  ["Invitation link required", "Lien d’invitation requis"],
  ["Invitation link unavailable", "Lien d’invitation indisponible"],
  ["Invitation reference", "Référence invitation"],
  [
    "Invitation registration is waiting for access",
    "L’enregistrement d’invitation attend l’accès",
  ],
  [
    "Invitation templates, generated files, and guest links stay closed until Diginoces can confirm workspace access.",
    "Les modèles d’invitation, fichiers générés et liens invités restent fermés jusqu’à confirmation de l’accès à l’espace.",
  ],
  ["Invitation workflow", "Flux d’invitation"],
  [
    "Keep design changes reviewable before any guest-facing files are generated.",
    "Gardez les changements de design vérifiables avant toute génération de fichiers visibles par les invités.",
  ],
  [
    "Keep guest names, sides, contacts, and event assignments together.",
    "Gardez ensemble noms, côtés, contacts et affectations événement des invités.",
  ],
  ["Keepsake message review", "Revue des messages souvenir"],
  ["Kept out of the export", "Exclu de l’export"],
  ["Latest export", "Dernier export"],
  [
    "Linked partner accounts will appear here after a manager grants access.",
    "Les comptes partenaires liés apparaîtront ici après octroi de l’accès par un responsable.",
  ],
  [
    "Long names need enough width and height before preview approval.",
    "Les noms longs nécessitent assez de largeur et de hauteur avant approbation de l’aperçu.",
  ],
  ["Manual approval", "Approbation manuelle"],
  ["Manual check-in is disabled", "L’accueil manuel est désactivé"],
  [
    "Mapping only prepares the preview. Guests are added later after review approval.",
    "La correspondance prépare seulement l’aperçu. Les invités sont ajoutés plus tard après approbation de la revue.",
  ],
  ["Mark deletion pending", "Marquer la suppression en attente"],
  [
    "Match the CSV columns to guest fields.",
    "Associez les colonnes CSV aux champs invités.",
  ],
  ["Message creation time", "Heure de création du message"],
  ["Message details", "Détails du message"],
  [
    "Message details will appear after this environment is connected to Diginoces access services.",
    "Les détails du message apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Message status was not updated",
    "Le statut du message n’a pas été mis à jour",
  ],
  ["Message templates", "Modèles de message"],
  ["Message was not prepared", "Le message n’a pas été préparé"],
  ["Message wording", "Texte du message"],
  [
    "Messages to send will appear after this environment is connected to Diginoces access services.",
    "Les messages à envoyer apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "New requests will appear here for review during event-day operations.",
    "Les nouvelles demandes apparaîtront ici pour revue pendant les opérations du jour J.",
  ],
  ["No access decisions yet", "Aucune décision d’accès pour le moment"],
  [
    "No additional event handoff pages are available for this role.",
    "Aucune page supplémentaire de transmission événement n’est disponible pour ce rôle.",
  ],
  ["No archive history yet", "Aucun historique d’archive pour le moment"],
  ["No check-in stations assigned", "Aucun poste d’accueil assigné"],
  ["No comments yet", "Aucun commentaire pour le moment"],
  ["No contract generated yet", "Aucun contrat généré pour le moment"],
  ["No dashboard access", "Aucun accès au tableau de bord"],
  ["No event signals yet", "Aucun signal événement pour le moment"],
  ["No events available", "Aucun événement disponible"],
  [
    "No file access history yet",
    "Aucun historique d’accès fichier pour le moment",
  ],
  ["No invitation design registered", "Aucun design d’invitation enregistré"],
  ["No matching invited guests", "Aucun invité correspondant"],
  ["No message wording yet", "Aucun texte de message pour le moment"],
  ["No parsed rows yet", "Aucune ligne analysée pour le moment"],
  [
    "No partner-created weddings yet",
    "Aucun mariage créé par partenaire pour le moment",
  ],
  ["No rows to review", "Aucune ligne à revoir"],
  ["No source records yet", "Aucun dossier source pour le moment"],
  ["No unexpected guest requests", "Aucune demande d’invité imprévu"],
  ["Offline guest", "Invité hors ligne"],
  [
    "Once a wedding is connected to this account, the latest movement appears here.",
    "Lorsque ce compte est lié à un mariage, la dernière activité apparaît ici.",
  ],
  [
    "Open check-in before recording new arrivals.",
    "Ouvrez l’accueil avant d’enregistrer de nouvelles arrivées.",
  ],
  ["Open project file vault", "Ouvrir le coffre-fort fichiers du mariage"],
  [
    "Operational identity, schedule, and venue details for this event.",
    "Identité opérationnelle, calendrier et lieu de cet événement.",
  ],
  ["Package details", "Détails du forfait"],
  ["Package selection is not ready", "La sélection de forfait n’est pas prête"],
  [
    "Packages and add-ons will appear here after they are created for this wedding.",
    "Les forfaits et options apparaîtront ici après leur création pour ce mariage.",
  ],
  ["Parsed rows", "Lignes analysées"],
  [
    "Parsed rows, review decisions, and apply controls will appear here after this environment is connected to Diginoces access services.",
    "Les lignes analysées, décisions de revue et contrôles d’application apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Partner details are not connected",
    "Les détails partenaire ne sont pas connectés",
  ],
  ["Payment date", "Date du paiement"],
  ["Payment record", "Dossier paiement"],
  [
    "Payment-gate decisions will appear after payment confirmation or an approved exception.",
    "Les décisions de seuil de paiement apparaîtront après confirmation du paiement ou exception approuvée.",
  ],
  ["Per guest", "Par invité"],
  [
    "Place one active invited guest at a table and add staff notes if needed.",
    "Placez un invité actif à une table et ajoutez des notes équipe si nécessaire.",
  ],
  ["Planned guest count", "Nombre d’invités prévu"],
  [
    "Position names, event details, table details, and the public guest page QR or link with enough room for long names.",
    "Positionnez noms, détails événement, détails table et QR ou lien public avec assez d’espace pour les noms longs.",
  ],
  [
    "Prepare a station list or submit one offline arrival record.",
    "Préparez une liste de postes ou envoyez une arrivée hors ligne.",
  ],
  [
    "Preview and generation activity will appear here after the team starts preparing invitation files.",
    "L’activité d’aperçu et de génération apparaîtra ici lorsque l’équipe commencera à préparer les invitations.",
  ],
  ["Private review note", "Note de revue privée"],
  ["Profile controls are limited", "Les contrôles du profil sont limités"],
  [
    "Profile details and partner project activity will appear here after secure workspace access is ready.",
    "Les détails du profil et l’activité partenaire apparaîtront ici lorsque l’accès sécurisé à l’espace sera prêt.",
  ],
  [
    "Project comments are unavailable",
    "Les commentaires du mariage sont indisponibles",
  ],
  ["Project contract", "Contrat du mariage"],
  [
    "Project data will appear after the Supabase workspace connection is ready. The page stays available without exposing project records.",
    "Les données du mariage apparaîtront lorsque la connexion Supabase sera prête. La page reste disponible sans exposer les dossiers.",
  ],
  [
    "Project documents will appear here after the workspace connection is ready.",
    "Les documents du mariage apparaîtront ici lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Project metrics will appear after the workspace connection is ready.",
    "Les métriques du mariage apparaîtront lorsque la connexion de l’espace sera prête.",
  ],
  ["Protected file record", "Dossier fichier protégé"],
  [
    "Public guest page QR and URL fields point guests to their invitation and RSVP page. They remain separate from future event-day check-in tokens.",
    "Les champs QR et URL de page publique envoient les invités vers leur invitation et RSVP. Ils restent séparés des futurs jetons d’accueil du jour J.",
  ],
  ["Readiness for guest files", "Préparation des fichiers invités"],
  ["Readiness review", "Revue de préparation"],
  [
    "Readiness tasks will appear here when the event has preparation work assigned.",
    "Les tâches de préparation apparaîtront ici lorsque l’événement aura du travail assigné.",
  ],
  ["Read-only access", "Accès lecture seule"],
  ["Read-only file access", "Accès fichier en lecture seule"],
  ["Ready for arrival.", "Prêt pour l’arrivée."],
  [
    "Recent payment-gate decisions for guest pages and invitation sending.",
    "Décisions récentes de seuil de paiement pour pages invitées et envoi d’invitations.",
  ],
  [
    "Recent preview and event file activity for this design.",
    "Activité récente d’aperçu et de fichiers événement pour ce design.",
  ],
  [
    "Record and confirm payments that control guest-facing access.",
    "Enregistrez et confirmez les paiements qui contrôlent l’accès côté invité.",
  ],
  [
    "Record contract changes when paid scope increases after approval.",
    "Enregistrez les changements de contrat lorsque le périmètre payé augmente après approbation.",
  ],
  ["Record payment", "Enregistrer le paiement"],
  ["Record updated file", "Enregistrer le fichier mis à jour"],
  [
    "Recorded payments will appear here with confirmation status and payment date.",
    "Les paiements enregistrés apparaîtront ici avec statut de confirmation et date de paiement.",
  ],
  [
    "Regenerate the CSV after seating changes so table-card names, VIP/protocol markers, and capacity counts stay aligned.",
    "Regénérez le CSV après les changements de placement afin d’aligner noms de cartons, marqueurs VIP/protocole et capacités.",
  ],
  [
    "Register a check-in station or staff tablet.",
    "Enregistrez un poste d’accueil ou une tablette équipe.",
  ],
  ["Register the event PDF", "Enregistrer le PDF de l’événement"],
  ["Related work", "Travail lié"],
  ["Request unexpected guest review", "Demander une revue d’invité imprévu"],
  [
    "Return to the import session and start again with a CSV file that includes a header row.",
    "Retournez à la session d’import et recommencez avec un CSV contenant une ligne d’en-tête.",
  ],
  ["Return to wedding", "Revenir au mariage"],
  [
    "Revenue, payment, and audit signals appear only when your role has matching access. Restricted values stay hidden instead of being approximated.",
    "Les signaux revenus, paiements et audit apparaissent seulement si votre rôle a l’accès correspondant. Les valeurs limitées restent masquées au lieu d’être approximées.",
  ],
  ["Review before adding guests", "Revoir avant d’ajouter les invités"],
  ["Review before confirming", "Revoir avant confirmation"],
  [
    "Review decisions are visible to users with moderation access.",
    "Les décisions de revue sont visibles par les utilisateurs ayant accès à la modération.",
  ],
  ["Review imported rows", "Revoir les lignes importées"],
  ["Review path", "Parcours de revue"],
  [
    "Review the table plan or generate the table-card CSV when the room plan is final.",
    "Revoyez le plan de table ou générez le CSV des cartons lorsque le plan de salle est final.",
  ],
  [
    "Review the template before using it to prepare guest messages.",
    "Revoyez le modèle avant de l’utiliser pour préparer des messages invités.",
  ],
  [
    "Review the updated table plan before preparing any printed handoff.",
    "Revoyez le plan de table mis à jour avant toute transmission imprimée.",
  ],
  [
    "Row approval controls will be available after this environment is connected to Diginoces access services.",
    "Les contrôles d’approbation de lignes seront disponibles après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "RSVP information will appear here after this environment is connected to Diginoces access services.",
    "Les informations RSVP apparaîtront ici après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  ["Save device", "Enregistrer l’appareil"],
  ["Save settings", "Enregistrer les paramètres"],
  [
    "Saved WhatsApp wording will appear after this environment is connected to Diginoces access services.",
    "Les textes WhatsApp enregistrés apparaîtront après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  ["Scan a guest invitation", "Scanner une invitation invité"],
  [
    "Scan controls will appear after the secure connection is ready.",
    "Les contrôles de scan apparaîtront lorsque la connexion sécurisée sera prête.",
  ],
  [
    "Seating action could not be completed",
    "L’action de placement n’a pas pu être terminée",
  ],
  ["Seating notes", "Notes de placement"],
  [
    "Seating tools will appear after the secure connection is ready.",
    "Les outils de placement apparaîtront lorsque la connexion sécurisée sera prête.",
  ],
  ["Secure file reference", "Référence fichier sécurisée"],
  ["Secure guest list", "Liste d’invités sécurisée"],
  ["Secure guest profile", "Fiche invité sécurisée"],
  ["Select a guest", "Sélectionner un invité"],
  ["Select an event", "Sélectionner un événement"],
  [
    "Sensitive guest, payment, partner, file, and activity areas stay hidden until Diginoces confirms this is still you.",
    "Les zones invités, paiements, partenaires, fichiers et activité restent masquées jusqu’à confirmation Diginoces.",
  ],
  [
    "Shared progress will appear here once the workspace connection is ready.",
    "La progression partagée apparaîtra ici lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Shared updates will appear here after the workspace connection is ready.",
    "Les mises à jour partagées apparaîtront ici lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Signals that usually decide the next event-team action.",
    "Signaux qui décident généralement de la prochaine action de l’équipe événement.",
  ],
  [
    "Signals will appear after RSVP, seating, invitation, or arrival activity is recorded for this event.",
    "Les signaux apparaîtront après enregistrement d’activité RSVP, placement, invitation ou arrivée pour cet événement.",
  ],
  ["Source CSV column", "Colonne CSV source"],
  ["Source summary", "Résumé source"],
  ["Source tracking", "Suivi source"],
  [
    "Source, version, and approval evidence for the invitation design.",
    "Preuves de source, version et approbation du design d’invitation.",
  ],
  ["Staged guest row", "Ligne invitée préparée"],
  ["Standard seating", "Placement standard"],
  [
    "Start by registering the event PDF export, then place guest names and public guest page fields before approval.",
    "Commencez par enregistrer l’export PDF de l’événement, puis placez les noms invités et champs de page publique avant approbation.",
  ],
  [
    "Start by registering the first contract, invitation asset, export, or report that needs controlled access.",
    "Commencez par enregistrer le premier contrat, élément d’invitation, export ou rapport nécessitant un accès contrôlé.",
  ],
  ["Status recorded", "Statut enregistré"],
  ["Submit offline record", "Envoyer l’enregistrement hors ligne"],
  ["Submit the import for review.", "Soumettre l’import en revue."],
  [
    "Submitted partner projects will appear here after secure access is ready.",
    "Les mariages soumis par partenaire apparaîtront ici lorsque l’accès sécurisé sera prêt.",
  ],
  [
    "Supabase is not configured for this environment, so guest import upload cannot start yet.",
    "Supabase n’est pas configuré pour cet environnement ; l’import invité ne peut pas encore démarrer.",
  ],
  [
    "Supabase is not configured for this environment, so import history cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; l’historique d’import ne peut pas encore être chargé.",
  ],
  [
    "Supabase is not configured for this environment, so import review decisions cannot be saved yet.",
    "Supabase n’est pas configuré pour cet environnement ; les décisions de revue ne peuvent pas encore être enregistrées.",
  ],
  [
    "Supabase is not configured for this environment, so message preparation cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; la préparation des messages ne peut pas encore être chargée.",
  ],
  [
    "Supabase is not configured for this environment, so message templates cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; les modèles de message ne peuvent pas encore être chargés.",
  ],
  [
    "Supabase is not configured for this environment, so project messages cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; les messages du mariage ne peuvent pas encore être chargés.",
  ],
  [
    "Supabase is not configured for this environment, so the page cannot load project guest data yet.",
    "Supabase n’est pas configuré pour cet environnement ; cette page ne peut pas encore charger les données invités.",
  ],
  [
    "Supabase is not configured for this environment, so the page cannot load this guest profile yet.",
    "Supabase n’est pas configuré pour cet environnement ; cette page ne peut pas encore charger cette fiche invitée.",
  ],
  [
    "Supabase is not configured for this environment, so the page cannot resolve this guest preview yet.",
    "Supabase n’est pas configuré pour cet environnement ; cette page ne peut pas encore résoudre cet aperçu invité.",
  ],
  [
    "Supabase is not configured for this environment, so this import session cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; cette session d’import ne peut pas encore être chargée.",
  ],
  [
    "Supabase is not configured for this environment, so this prepared message cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; ce message préparé ne peut pas encore être chargé.",
  ],
  ["Supervisor approval", "Approbation superviseur"],
  ["Supervisor approval required", "Approbation superviseur requise"],
  [
    "Supervisor decisions for guests who are not on the planned list.",
    "Décisions superviseur pour les invités absents de la liste prévue.",
  ],
  [
    "Table setup is read-only for your role",
    "La configuration des tables est en lecture seule pour votre rôle",
  ],
  ["Table-card CSV", "CSV des cartons de table"],
  [
    "Tables will appear here after they are added to the seating plan.",
    "Les tables apparaîtront ici après leur ajout au plan de placement.",
  ],
  [
    "Template details will appear after the secure workspace connection is ready.",
    "Les détails du modèle apparaîtront lorsque la connexion sécurisée sera prête.",
  ],
  ["Template was not saved", "Le modèle n’a pas été enregistré"],
  [
    "The couple view stays unavailable until the project data connection is configured.",
    "La vue couple reste indisponible jusqu’à configuration de la connexion des données du mariage.",
  ],
  [
    "The design should move through field placement, placement preview approval, and generation without mixing guest page and check-in token behavior.",
    "Le design doit passer par le placement des champs, l’approbation de l’aperçu et la génération sans mélanger page invitée et jetons d’accueil.",
  ],
  [
    "The invitation preview will appear here after the workspace is connected to Diginoces access services.",
    "L’aperçu d’invitation apparaîtra ici après connexion de l’espace aux services d’accès Diginoces.",
  ],
  [
    "The page stays available without exposing project records until the Supabase connection is configured.",
    "La page reste disponible sans exposer les dossiers du mariage jusqu’à configuration de Supabase.",
  ],
  [
    "The PDF registration form will appear after the secure workspace connection is ready.",
    "Le formulaire d’enregistrement PDF apparaîtra lorsque la connexion sécurisée sera prête.",
  ],
  [
    "The QR reference matched this event and no readiness warning is showing.",
    "La référence QR correspond à cet événement et aucune alerte de préparation n’apparaît.",
  ],
  [
    "The row is acceptable and can become a guest later.",
    "La ligne est acceptable et pourra devenir un invité plus tard.",
  ],
  [
    "The row should not be used for this wedding.",
    "La ligne ne doit pas être utilisée pour ce mariage.",
  ],
  [
    "This area will fill in as the event team records activity.",
    "Cette zone se remplira lorsque l’équipe événement enregistrera l’activité.",
  ],
  [
    "This invitation link is invalid, expired, or has been revoked.",
    "Ce lien d’invitation est invalide, expiré ou révoqué.",
  ],
  [
    "This note is internal to the Diginoces review workflow.",
    "Cette note est interne au flux de revue Diginoces.",
  ],
  [
    "This page is for triage. Open the wedding, report, or activity surface before making operational changes.",
    "Cette page sert au triage. Ouvrez le mariage, le rapport ou l’espace d’activité avant de faire des changements opérationnels.",
  ],
  [
    "This page is secure by default. Ask a Diginoces administrator to finish the workspace connection before opening file records.",
    "Cette page est sécurisée par défaut. Demandez à un administrateur Diginoces de terminer la connexion avant d’ouvrir les fichiers.",
  ],
  [
    "This page is secure by default. Ask a Diginoces administrator to finish the workspace connection before opening this file.",
    "Cette page est sécurisée par défaut. Demandez à un administrateur Diginoces de terminer la connexion avant d’ouvrir ce fichier.",
  ],
  [
    "This page is secure by default. Ask a Diginoces administrator to finish the workspace connection before posting or reading project updates.",
    "Cette page est sécurisée par défaut. Demandez à un administrateur Diginoces de terminer la connexion avant de publier ou lire les mises à jour.",
  ],
  [
    "This page is secure by default. Ask a Diginoces administrator to finish the workspace connection before reviewing commercial controls.",
    "Cette page est sécurisée par défaut. Demandez à un administrateur Diginoces de terminer la connexion avant de revoir les contrôles commerciaux.",
  ],
  [
    "This page is secure by default. Ask a Diginoces administrator to finish the workspace connection before reviewing global operations.",
    "Cette page est sécurisée par défaut. Demandez à un administrateur Diginoces de terminer la connexion avant de revoir les opérations globales.",
  ],
  [
    "This page opens only from a valid personal guest link shared for the celebration.",
    "Cette page s’ouvre uniquement depuis un lien invité personnel valide partagé pour la célébration.",
  ],
  [
    "This role can read the event dashboard but cannot open the detailed event work areas from this view.",
    "Ce rôle peut lire le tableau événement mais ne peut pas ouvrir les zones détaillées depuis cette vue.",
  ],
  [
    "This section stays inside the project unless the couple separately grants testimonial permission.",
    "Cette section reste dans le mariage sauf si le couple autorise séparément l’usage en témoignage.",
  ],
  ["Unassigned active guests", "Invités actifs non placés"],
  [
    "Unexpected guest intake is unavailable",
    "La saisie d’invité imprévu est indisponible",
  ],
  [
    "Unexpected guests are being handled outside the approval queue for this event.",
    "Les invités imprévus sont gérés hors file d’approbation pour cet événement.",
  ],
  ["Updated file", "Fichier mis à jour"],
  ["Upload access limited", "Accès import limité"],
  [
    "Uploaded guest lists will appear here after this environment is connected to Diginoces access services.",
    "Les listes invitées importées apparaîtront ici après connexion de cet environnement aux services d’accès Diginoces.",
  ],
  [
    "Use an enabled method or update event check-in settings.",
    "Utilisez une méthode activée ou mettez à jour les paramètres d’accueil.",
  ],
  [
    "Use manual check-in from the event desk, or update event settings before scanning QR references.",
    "Utilisez l’accueil manuel depuis le poste événement, ou mettez à jour les paramètres avant de scanner les QR.",
  ],
  [
    "Use review decisions to keep the guest list clean before rows are applied.",
    "Utilisez les décisions de revue pour garder la liste propre avant application des lignes.",
  ],
  [
    "Use the Canva-exported PDF for this event. Source files remain outside this workflow until a later file-storage step supports them.",
    "Utilisez le PDF exporté depuis Canva pour cet événement. Les fichiers source restent hors de ce flux jusqu’à une étape de stockage ultérieure.",
  ],
  ["Use the newest generated file", "Utiliser le dernier fichier généré"],
  [
    "Use this only when someone arrives who is not on the invited guest list.",
    "Utilisez ceci seulement lorsqu’une personne arrive sans être dans la liste invitée.",
  ],
  [
    "Use values from 0 to 1 for left-to-right and top-to-bottom placement. Save fields before generating a preview.",
    "Utilisez des valeurs de 0 à 1 pour le placement gauche-droite et haut-bas. Enregistrez les champs avant de générer un aperçu.",
  ],
  [
    "Validate the CSV preview before opening review decisions.",
    "Validez l’aperçu CSV avant d’ouvrir les décisions de revue.",
  ],
  [
    "Validate the preview and correct blocked rows.",
    "Validez l’aperçu et corrigez les lignes bloquées.",
  ],
  ["Visibility controls access", "La visibilité contrôle l’accès"],
  [
    "Wedding file vault is unavailable",
    "Le coffre-fort fichiers du mariage est indisponible",
  ],
  ["Wedding workspace", "Espace mariage"],
  ["Whole project", "Tout le mariage"],
  [
    "Work areas, events, and actions are limited to what your role can access. Missing destinations usually mean the project membership or role assignment needs review.",
    "Les zones de travail, événements et actions sont limités à ce que votre rôle peut ouvrir. Une destination manquante indique souvent que l’adhésion ou le rôle doit être revu.",
  ],
  ["Workspace connection needed", "Connexion de l’espace nécessaire"],
  [
    "You can read import history, but your current role cannot start a new guest import for this project.",
    "Vous pouvez lire l’historique d’import, mais votre rôle actuel ne peut pas démarrer un nouvel import invité pour ce mariage.",
  ],
  [
    "You can review invitation designs for this event. A Diginoces teammate with template access can register a new PDF design.",
    "Vous pouvez revoir les designs d’invitation de cet événement. Un membre Diginoces ayant accès aux modèles peut enregistrer un nouveau PDF.",
  ],
  [
    "You can review registered files, but your role cannot add file records to this wedding.",
    "Vous pouvez consulter les fichiers enregistrés, mais votre rôle ne peut pas ajouter de fichiers à ce mariage.",
  ],
  [
    "You can review retention state, but only authorized Diginoces roles can update archive lifecycle decisions.",
    "Vous pouvez consulter l’état de conservation, mais seuls les rôles Diginoces autorisés peuvent mettre à jour les décisions d’archive.",
  ],
  [
    "You can review saved wording, but template changes require a role with message-template management access.",
    "Vous pouvez revoir les textes enregistrés, mais les changements de modèle exigent un rôle de gestion des modèles.",
  ],
  [
    "You can review the current plan. A user with table management access can add or edit tables.",
    "Vous pouvez revoir le plan actuel. Un utilisateur ayant accès à la gestion des tables peut en ajouter ou modifier.",
  ],
  [
    "You can review the project thread, but your role cannot add comments to this wedding.",
    "Vous pouvez consulter le fil du mariage, mais votre rôle ne peut pas ajouter de commentaires.",
  ],
  [
    "You can review this file, but your role cannot record updated versions for it.",
    "Vous pouvez consulter ce fichier, mais votre rôle ne peut pas enregistrer de nouvelles versions.",
  ],
  [
    "You can review this profile, but status and account changes require partner management access.",
    "Vous pouvez consulter ce profil, mais les changements de statut et de compte exigent l’accès gestion partenaire.",
  ],
  [
    "You can still read the thread, but posting controls are hidden until Diginoces can confirm your access. Refresh the page or contact an administrator.",
    "Vous pouvez toujours lire le fil, mais les contrôles de publication restent masqués jusqu’à confirmation de votre accès par Diginoces. Actualisez la page ou contactez un administrateur.",
  ],
  [
    "You can use the available check-in tools, but only authorized event leads can change methods and timing.",
    "Vous pouvez utiliser les outils d’accueil disponibles, mais seuls les responsables événement autorisés peuvent modifier les méthodes et horaires.",
  ],
  [
    "You can view this design, but preview and generation actions require invitation template permissions.",
    "Vous pouvez voir ce design, mais les actions d’aperçu et de génération exigent les permissions de modèle d’invitation.",
  ],
  [
    "Your role can read this event, but no event work areas are available to this account yet.",
    "Votre rôle peut lire cet événement, mais aucune zone de travail événement n’est encore disponible pour ce compte.",
  ],
  [
    "Your role can read this prepared message, but only authorized team members can open the sending controls and record outcomes.",
    "Votre rôle peut lire ce message préparé, mais seuls les membres autorisés peuvent ouvrir les contrôles d’envoi et enregistrer les résultats.",
  ],
  ["Private team notes", "Notes privées de l’équipe"],
  ["Visible partner profiles", "Profils partenaires visibles"],
  ["Partner", "Partenaire"],
  ["Profile controls", "Contrôles du profil"],
  ["Lifecycle status", "Statut du cycle de vie"],
  ["Save status", "Enregistrer le statut"],
  ["Linked accounts", "Comptes liés"],
  ["Project submissions", "Soumissions de mariages"],
  ["Choose a partner profile", "Choisir un profil partenaire"],
  ["Diginoces review", "Revue Diginoces"],
  ["Review queue", "File de revue"],
  ["Readiness", "Préparation"],
  ["Current versions", "Versions actuelles"],
  ["File handoff", "Transmission des fichiers"],
  ["Deadline", "Échéance"],
  ["Tables on map", "Tables sur le plan"],
  ["Capacity alerts", "Alertes de capacité"],
  ["Table index", "Index des tables"],
  ["No preview is waiting", "Aucun aperçu en attente"],
  ["No template errors recorded", "Aucune erreur de modèle enregistrée"],
  ["Canva PDF export", "Export PDF Canva"],
  ["Cancel", "Annuler"],
  ["Latest response", "Dernière réponse"],
  ["Service signal", "Signal de service"],
  ["Visibility", "Visibilité"],
  ["Visibility guide", "Guide de visibilité"],
  ["Prepare messages", "Préparer les messages"],
  ["Wording readiness", "Préparation des textes"],
  ["Manage wording", "Gérer les textes"],
  ["Check-in desk", "Poste d’accueil"],
  ["Matched guest", "Invité trouvé"],
  ["Arrival state", "État d’arrivée"],
  ["Waiting for scan", "En attente de scan"],
  ["Arrival confirmation", "Confirmation d’arrivée"],
  ["Waiting", "En attente"],
  ["Prepared message", "Message préparé"],
  ["Delivery summary", "Résumé de livraison"],
  ["Send and record outcome", "Envoyer et enregistrer le résultat"],
  ["Recipient channel", "Canal du destinataire"],
  ["Template used for rendering", "Modèle utilisé pour le rendu"],
  ["Name and side", "Nom et côté"],
  ["Language preference", "Préférence de langue"],
  ["Protected records", "Dossiers protégés"],
  ["All records", "Tous les dossiers"],
  ["Canva CSV export", "Export CSV Canva"],
  ["Table card export", "Export des cartons de table"],
  ["Current only", "Version actuelle seulement"],
  ["Retention decision", "Décision de conservation"],
  ["Visibility changes access", "La visibilité modifie l’accès"],
  ["Staff preview", "Aperçu équipe"],
  ["Preview mode", "Mode aperçu"],
  ["Preview context", "Contexte de l’aperçu"],
  ["Your RSVP", "Votre RSVP"],
  ["Profile identity", "Identité du profil"],
  ["Profile state", "État du profil"],
  ["Side", "Côté"],
  ["Profile guidance", "Aide sur le profil"],
  ["Language coverage", "Couverture linguistique"],
  ["Manual send preparation", "Préparation de l’envoi manuel"],
  ["Record summary", "Résumé du dossier"],
  ["Current version", "Version actuelle"],
  ["Retention status", "Statut de conservation"],
  ["Version and access history", "Historique des versions et accès"],
  ["Allowed access", "Accès autorisé"],
  ["Denied access", "Accès refusé"],
  ["Version note", "Note de version"],
  ["Archive decision", "Décision d’archivage"],
  ["List side", "Côté de la liste"],
  ["Paste spreadsheet rows", "Coller les lignes du tableur"],
  ["CSV-only import", "Import CSV uniquement"],
  ["Send clear changes", "Envoyer des corrections claires"],
  ["Next note", "Prochaine note"],
  ["Decision guide", "Guide de décision"],
  ["Import session", "Session d’import"],
  ["Column mapping", "Correspondance des colonnes"],
  ["Review rows", "Revoir les lignes"],
  ["Submit for review", "Soumettre pour revue"],
  ["Apply approved rows", "Ajouter les lignes approuvées"],
  ["Import safety", "Sécurité de l’import"],
  ["Diginoces field", "Champ Diginoces"],
  ["Source file", "Fichier source"],
  ["Decision", "Décision"],
  ["Review notes", "Notes de revue"],
  ["Decision summary", "Résumé de décision"],
  ["Current decisions", "Décisions actuelles"],
  ["No project reference", "Aucune référence projet"],
  ["No partner profile is linked", "Aucun profil partenaire n’est lié"],
  ["No assigned weddings yet", "Aucun mariage assigné pour le moment"],
  ["No submissions yet", "Aucune soumission pour le moment"],
  ["No submissions waiting", "Aucune soumission en attente"],
  ["No recent weddings yet", "Aucun mariage récent pour le moment"],
  ["No activity visible", "Aucune activité visible"],
  ["No reports available", "Aucun rapport disponible"],
  ["No exports yet", "Aucun export pour le moment"],
  ["No linked record", "Aucun dossier lié"],
  ["No reason note recorded.", "Aucune note de raison enregistrée."],
  [
    "No event work areas available",
    "Aucune zone de travail événement disponible",
  ],
  ["No file runs yet", "Aucune génération de fichier pour le moment"],
  ["No guest files generated", "Aucun fichier invité généré"],
  ["No guest selected", "Aucun invité sélectionné"],
  ["No side", "Aucun côté"],
  ["No RSVP", "Aucun RSVP"],
  ["No capacity", "Aucune capacité"],
  ["No tables on the map yet", "Aucune table sur le plan pour le moment"],
  ["No table index yet", "Aucun index de table pour le moment"],
  ["Ready for invitations", "Prêt pour les invitations"],
  ["Ready to scan", "Prêt à scanner"],
  ["Ready for use", "Prêt à l’utilisation"],
  ["Not available", "Non disponible"],
  ["Not generated", "Non généré"],
  ["Not approved", "Non approuvé"],
  ["Guest estimate", "Estimation invités"],
  ["Guest display name", "Nom affiché de l’invité"],
  ["Guest name", "Nom de l’invité"],
  ["Guest title", "Titre de l’invité"],
  ["Event name", "Nom de l’événement"],
  ["Event date", "Date de l’événement"],
  ["Event venue", "Lieu de l’événement"],
  ["Invitation ID", "ID invitation"],
  ["Guest files", "Fichiers invités"],
  ["Guest invitation records", "Dossiers d’invitation invités"],
  ["File type", "Type de fichier"],
  ["File size", "Taille du fichier"],
  ["Review decision", "Décision de revue"],
  ["Review access only", "Accès revue uniquement"],
  ["Save review", "Enregistrer la revue"],
  ["Save field positions", "Enregistrer les positions des champs"],
  ["Generate preview", "Générer l’aperçu"],
  ["Approve preview", "Approuver l’aperçu"],
  ["Generate event invitations", "Générer les invitations de l’événement"],
  ["Generate CSV", "Générer le CSV"],
  ["Open profile", "Ouvrir le profil"],
  ["Open wedding", "Ouvrir le mariage"],
  [
    "Open reports for the full workspace",
    "Ouvrir les rapports de tout l’espace",
  ],
  [
    "Open activity history for the full workspace",
    "Ouvrir l’historique de tout l’espace",
  ],
  ["Create a wedding submission", "Créer une soumission de mariage"],
  ["Create submission", "Créer la soumission"],
  ["Create partner profile", "Créer un profil partenaire"],
  ["Create partner", "Créer le partenaire"],
  ["Request email code", "Demander un code e-mail"],
  ["A six-digit code was sent to", "Un code à six chiffres a été envoyé à"],
  [
    "Enter your approved email address. Then use the six-digit code sent to your inbox.",
    "Saisissez votre adresse approuvée. Utilisez ensuite le code à six chiffres reçu par e-mail.",
  ],
  [
    "Use your approved email address to open wedding projects, guest lists, RSVP, invitations, messages, seating, check-in, reports, files, and partner work.",
    "Utilisez votre adresse e-mail approuvée pour ouvrir les mariages, listes d’invités, RSVP, invitations, messages, placement, accueil, rapports, fichiers et tâches partenaires.",
  ],
  [
    "Repeated requests may be rate limited. Use the newest email if you request more than one code.",
    "Les demandes répétées peuvent être limitées. Utilisez le dernier e-mail si vous demandez plus d’un code.",
  ],
  [
    "Start with the records most teams need first. Available actions still depend on your role.",
    "Commencez par les dossiers dont la plupart des équipes ont besoin. Les actions disponibles dépendent toujours de votre rôle.",
  ],
  [
    "This compact view shows wording readiness, prepared messages, and work waiting for a manual send.",
    "Cette vue compacte montre l’état des textes, les messages préparés et le travail en attente d’un envoi manuel.",
  ],
  [
    "Use this queue to see what needs attention before the team records a final sending result.",
    "Utilisez cette file pour voir ce qui demande une attention avant que l’équipe enregistre le résultat final.",
  ],
  [
    "Open nearby workflows without losing the current project.",
    "Ouvrez les flux proches sans perdre le mariage en cours.",
  ],
  [
    "Open quick navigation with Ctrl or Command plus K",
    "Ouvrir la navigation rapide avec Ctrl ou Commande plus K",
  ],
  [
    "Search opens the destination; sensitive records still follow your role, MFA, and project access.",
    "La recherche ouvre la destination ; les dossiers sensibles restent limités par votre rôle, MFA et accès projet.",
  ],
  [
    "Try a workflow word such as guests, RSVP, imports, invitations, messages, seating, check-in, reports, or partners.",
    "Essayez un mot de travail comme invités, RSVP, imports, invitations, messages, placement, accueil, rapports ou partenaires.",
  ],
  [
    "You only see weddings connected to this account. Open one to continue inside its project workspace.",
    "Vous voyez seulement les mariages liés à ce compte. Ouvrez-en un pour continuer dans son espace de travail.",
  ],
] as const;

const baseExactEnglishToFrench = defineExactTranslations(
  "baseExactEnglishToFrench",
  baseExactEnglishToFrenchEntries,
);
const supplementalExactEnglishToFrenchEntries = [
  ["Add", "Ajouter"],
  ["Added", "Ajouté"],
  [
    "Add dates, venues, or delivery context that helps the operations team start cleanly.",
    "Ajoutez les dates, lieux ou éléments de livraison utiles à l’équipe opérations pour démarrer proprement.",
  ],
  ["Addendum", "Avenant"],
  ["Addendums", "Avenants"],
  ["Admin", "Administrateur"],
  ["Admin action", "Action administrateur"],
  ["Alignment", "Alignement"],
  ["Amount", "Montant"],
  ["Attempts", "Tentatives"],
  [
    "Assign a role to an existing user before they can open protected platform areas.",
    "Attribuez un rôle à un utilisateur existant avant qu’il puisse ouvrir les zones protégées de la plateforme.",
  ],
  [
    "Assign or revoke sensitive platform roles for existing Diginoces users.",
    "Attribuez ou révoquez les rôles sensibles de plateforme pour les utilisateurs Diginoces existants.",
  ],
  [
    "Assign platform roles to existing users, then keep wedding and event roles scoped inside the right workspace.",
    "Attribuez les rôles de plateforme aux utilisateurs existants, puis gardez les rôles mariage et événement dans le bon espace.",
  ],
  ["Assigned", "Assigné"],
  ["Approvals", "Approbations"],
  ["Archive", "Archiver"],
  ["Area", "Zone"],
  ["Areas", "Zones"],
  ["Arrival", "Arrivée"],
  ["Arrivals", "Arrivées"],
  ["Category", "Catégorie"],
  ["Center", "Centre"],
  ["Channel", "Canal"],
  ["Checkpoint", "Point de contrôle"],
  [
    "Choose the new retention end date.",
    "Choisissez la nouvelle date de fin de conservation.",
  ],
  ["Complete", "Terminer"],
  ["Confirm", "Confirmer"],
  ["Contact name", "Nom du contact"],
  ["Context", "Contexte"],
  ["Count", "Nombre"],
  ["Create a wedding project", "Créer un dossier de mariage"],
  ["Create first event", "Créer le premier événement"],
  ["Create wedding", "Créer un mariage"],
  ["Create wedding project", "Créer le dossier mariage"],
  ["Design", "Création"],
  ["Designs", "Créations"],
  ["Detail", "Détail"],
  ["Device", "Appareil"],
  ["Disabled", "Désactivé"],
  ["Diginoces Platform", "Plateforme Diginoces"],
  ["Enabled", "Activé"],
  ["Evidence", "Preuves"],
  ["Exclude", "Exclure"],
  ["Excluded", "Exclu"],
  ["Existing users only", "Utilisateurs existants uniquement"],
  ["Extend retention date", "Prolonger la date de conservation"],
  ["Extend retention through", "Prolonger la conservation jusqu’au"],
  ["Field", "Champ"],
  ["Fields", "Champs"],
  ["Flat", "Fixe"],
  ["From", "Du"],
  ["Gate", "Contrôle d’accès"],
  ["Generated", "Généré"],
  ["Guest list summary", "Résumé de la liste d’invités"],
  ["Headers", "En-têtes"],
  ["Height", "Hauteur"],
  ["Horizontal", "Position horizontale"],
  ["Inactive", "Inactif"],
  ["Item", "Élément"],
  ["Label", "Libellé"],
  ["Left", "Gauche"],
  ["Manage access control", "Gérer les accès"],
  ["Mark retention complete", "Marquer la conservation terminée"],
  ["Member", "Membre"],
  ["Method", "Méthode"],
  ["Name", "Nom"],
  ["None", "Aucun"],
  ["Organization", "Organisation"],
  ["Overall", "Global"],
  ["Payment", "Paiement"],
  ["Percentage", "Pourcentage"],
  ["Prepared", "Préparé"],
  ["Purpose", "Objectif"],
  ["Reason", "Raison"],
  ["Record", "Dossier"],
  ["Reference", "Référence"],
  ["Reject", "Rejeter"],
  ["Remaining", "Restant"],
  ["Responses", "Réponses"],
  ["Result", "Résultat"],
  ["Retention action", "Action de conservation"],
  ["Reviewed", "Relu"],
  ["Right", "Droite"],
  ["Run", "Lot"],
  ["Runs", "Lots"],
  ["Save", "Enregistrer"],
  ["Scope", "Périmètre"],
  ["Session verification", "Contrôle de session"],
  ["Settings", "Paramètres"],
  ["Showing", "Affichage"],
  ["Signal", "Indicateur"],
  ["Size", "Taille"],
  ["State", "État"],
  ["Station", "Poste"],
  ["Submissions", "Soumissions"],
  ["Sync", "Synchronisation"],
  ["Thread", "Fil"],
  ["Time", "Heure"],
  ["Timezone", "Fuseau horaire"],
  ["Title", "Titre"],
  ["To", "Au"],
  ["Unknown", "Inconnu"],
  ["Update", "Mettre à jour"],
  ["User", "Utilisateur"],
  ["Value", "Valeur"],
  ["Vertical", "Position verticale"],
  ["Versions", "Versions"],
  [
    "Wedding guest operations workspace for Diginoces.",
    "Espace Diginoces de pilotage des invités de mariage.",
  ],
  ["Wedding project was not created", "Le mariage n’a pas été créé"],
  ["Width", "Largeur"],
  ["Wording", "Texte"],
  [
    "Start the secure workspace for a couple. Events, guests, invitations, and delivery work stay inside the project after it is created.",
    "Démarrez l’espace sécurisé du couple. Les événements, invités, invitations et opérations de livraison resteront dans le dossier après sa création.",
  ],
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
  ["0 is left, 1 is right.", "0 correspond à gauche, 1 à droite."],
  ["0 is top, 1 is bottom.", "0 correspond au haut, 1 au bas."],
  [
    "A project contract was generated from the current package and pricing details.",
    "Un contrat de projet a été généré à partir du forfait et des détails tarifaires actuels.",
  ],
  [
    "A sample is ready. Review placement before approval.",
    "Un échantillon est prêt. Vérifiez le placement avant l’approbation.",
  ],
  ["A shared progress view for", "Vue de progression partagée pour"],
  [
    "Access remains open until the agreed date",
    "L’accès reste ouvert jusqu’à la date convenue",
  ],
  ["Account reference", "Référence du compte"],
  ["Action did not complete", "L’action n’a pas abouti"],
  ["Action, source, reason, or ID", "Action, source, raison ou ID"],
  [
    "Actions appear only when your role can perform them.",
    "Les actions apparaissent seulement lorsque votre rôle peut les effectuer.",
  ],
  ["Active filters", "Filtres actifs"],
  ["Active occupancy", "Occupation active"],
  ["Active wording", "Texte actif"],
  ["Add a guest", "Ajouter un nouvel invité"],
  [
    "Add a note only when the team needs context for a correction or exclusion.",
    "Ajoutez une note seulement lorsque l’équipe a besoin de contexte pour une correction ou une exclusion.",
  ],
  [
    "Add a private note when the testimonial needs context for future use.",
    "Ajoutez une note privée lorsque le témoignage a besoin de contexte pour un usage futur.",
  ],
  ["Add-on created", "Option créée"],
  ["Add-on description", "Description de l’option"],
  ["Add-on name", "Nom de l’option"],
  ["Add-on reference", "Référence de l’option"],
  ["Addendum recorded", "Avenant enregistré"],
  ["Additional amount in cents", "Montant additionnel en centimes"],
  ["After registration", "Après l’enregistrement"],
  ["All tables", "Toutes les tables"],
  ["Any assigned device", "Tout appareil assigné"],
  [
    "Apply activity history filters",
    "Appliquer les filtres de l’historique d’activité",
  ],
  ["Apply adjustment", "Appliquer l’ajustement"],
  ["Apply archive action", "Appliquer l’action d’archivage"],
  ["Apply filters", "Appliquer les filtres"],
  ["Approve before generation", "Approuver avant génération"],
  ["Approve exception", "Approuver l’exception"],
  ["Approve testimonial", "Approuver le témoignage"],
  ["Approved adjustment", "Ajustement approuvé"],
  ["Approved designs", "Designs approuvés"],
  [
    "Approved designs ready for guest invitation files.",
    "Designs approuvés prêts pour les fichiers d’invitation invités.",
  ],
  ["Archive action", "Action d’archivage"],
  ["Archive action failed", "L’action d’archivage a échoué"],
  ["Archive reason", "Raison d’archivage"],
  ["Archive trail", "Historique d’archivage"],
  [
    "Arrival activity recorded by the event team.",
    "Activité d’arrivée enregistrée par l’équipe événement.",
  ],
  ["Arrival count", "Nombre d’arrivées"],
  ["Arrival progress", "Progression des arrivées"],
  [
    "Arrivals already confirmed at a station.",
    "Arrivées déjà confirmées à un poste.",
  ],
  ["Ask for a fresh personal link", "Demander un nouveau lien personnel"],
  ["Assign guest", "Affecter l’invité"],
  ["Assigned staff user", "Membre d’équipe assigné"],
  ["Assigned weddings", "Mariages assignés"],
  ["Bank transfer", "Virement bancaire"],
  ["Base price in cents", "Prix de base en centimes"],
  ["Blocked rows", "Lignes bloquées"],
  ["Both only", "Les deux uniquement"],
  ["Bride + both", "Mariée + les deux"],
  ["Bride name", "Nom de la mariée"],
  ["Brief decision note", "Brève note de décision"],
  ["CSV export", "Export CSV"],
  ["CSV exports", "Exports CSV"],
  ["CSV import", "Import CSV"],
  ["CSV versions tracked", "Versions CSV suivies"],
  ["Canva PDF -", "PDF Canva -"],
  [
    "Capture private notes, service ratings, and optional testimonial permission in one reviewable record.",
    "Saisissez les notes privées, évaluations de service et autorisation de témoignage dans un dossier révisable.",
  ],
  [
    "Categories help with VIP handling, family groups, and later follow-up.",
    "Les catégories aident au traitement VIP, aux groupes familiaux et aux suivis ultérieurs.",
  ],
  ["Change reason", "Raison du changement"],
  ["Change saved", "Changement enregistré"],
  ["Check preview", "Vérifier l’aperçu"],
  ["Choose title or type", "Choisir un titre ou type"],
  ["Clear filters", "Effacer les filtres"],
  ["Code was not accepted", "Le code n’a pas été accepté"],
  ["Column matches", "Correspondances de colonnes"],
  ["Comment needs attention", "Le commentaire demande une attention"],
  [
    "Comment permissions could not be checked",
    "Les permissions de commentaire n’ont pas pu être vérifiées",
  ],
  ["Comment posted", "Commentaire publié"],
  ["Comment was not posted", "Le commentaire n’a pas été publié"],
  ["Commercial change failed", "Le changement commercial a échoué"],
  [
    "Commercial request needs attention",
    "La demande commerciale demande une attention",
  ],
  ["Communication channel", "Canal de communication"],
  ["Communication route", "Mode de communication"],
  ["Connection required", "Connexion requise"],
  ["Contact email", "E-mail de contact"],
  ["Contact phone", "Téléphone de contact"],
  [
    "Continue with the normal sign-in flow, then return here when Diginoces asks for another verification step.",
    "Continuez avec la connexion normale, puis revenez ici lorsque Diginoces demande une vérification supplémentaire.",
  ],
  ["Contract approved", "Contrat approuvé"],
  ["Contract generated", "Contrat généré"],
  ["Contracts and payments", "Contrats et paiements du projet"],
  [
    "Contracts generated or waiting for approval.",
    "Contrats générés ou en attente d’approbation.",
  ],
  ["Couple and contact", "Couple et contact"],
  ["Couple decision", "Décision du couple"],
  ["Couple visible", "Visible par le couple"],
  ["Current balance", "Solde actuel"],
  [
    "Current guest replies that affect event attendance.",
    "Réponses invitées actuelles qui influencent la présence à l’événement.",
  ],
  ["Current state", "État actuel"],
  ["Design name", "Nom du design"],
  ["Design record", "Dossier du design"],
  [
    "Designs waiting for preview review or approval.",
    "Designs en attente de revue d’aperçu ou d’approbation.",
  ],
  ["Desk rhythm", "Rythme du bureau"],
  ["Decision for row", "Décision pour la ligne"],
  ["Decision saved", "Décision enregistrée"],
  ["Decision was not saved", "La décision n’a pas été enregistrée"],
  ["Device label", "Libellé de l’appareil"],
  ["Devices and stations", "Appareils et postes"],
  ["Diginoces RSVP", "Réponse Diginoces"],
  ["Displays the mobile sidebar.", "Affiche la barre latérale mobile."],
  ["Display name", "Nom affiché"],
  ["Duplicate check", "Vérification des doublons"],
  ["Duplicate scans", "Scans en doublon"],
  ["End date for the audit window.", "Date de fin de la période d’audit."],
  ["Ends at", "Se termine à"],
  ["English, French", "Anglais, français"],
  ["English wording", "Texte anglais"],
  ["Enter your authenticator code", "Saisissez votre code d’authentification"],
  ["Entrance A", "Entrée A"],
  ["Event selection saved", "Sélection d’événement enregistrée"],
  ["Event time changed", "Horaire de l’événement modifié"],
  ["Evidence path", "Parcours de preuve"],
  ["Example: guest.updated", "Exemple : guest.updated"],
  ["Example: guests", "Exemple : guests"],
  ["Exception reason", "Raison de l’exception"],
  ["Exception terms", "Conditions de l’exception"],
  ["Excluded or flagged", "Exclus ou signalés"],
  ["Expected arrivals", "Arrivées attendues"],
  ["Experience ratings", "Évaluations d’expérience"],
  [
    "Explain what should be corrected or why this note should be excluded.",
    "Expliquez ce qui doit être corrigé ou pourquoi cette note doit être exclue.",
  ],
  [
    "Export filtered activity history as CSV",
    "Exporter l’historique d’activité filtré en CSV",
  ],
  ["Export prepared", "Export préparé"],
  [
    "Exports are redacted by design",
    "Les exports sont expurgés par conception",
  ],
  [
    "Failed or skipped messages need a reason so another team member understands what happened.",
    "Les messages échoués ou ignorés ont besoin d’une raison pour qu’un autre membre de l’équipe comprenne ce qui s’est passé.",
  ],
  ["Failure reason", "Raison de l’échec"],
  ["Feedback saved", "Retour enregistré"],
  ["Feedback was not saved", "Le retour n’a pas été enregistré"],
  ["Field placed", "Champ placé"],
  ["Fields placed", "Champs placés"],
  ["File action not allowed", "Action fichier non autorisée"],
  ["File archived", "Fichier archivé"],
  ["File registered", "Fichier enregistré"],
  ["File was not registered", "Le fichier n’a pas été enregistré"],
  ["Final recorded outcome", "Résultat final enregistré"],
  ["Fixed amount", "Montant fixe"],
  ["Fixed amount in cents", "Montant fixe en centimes"],
  ["Focus the list", "Cibler la liste"],
  ["Follow-up needed", "Suivi nécessaire"],
  ["Font family", "Police"],
  ["Font size", "Taille de police"],
  ["French wording", "Texte français"],
  ["Full service", "Service complet"],
  ["Generate files", "Générer les fichiers"],
  ["Generation runs", "Générations"],
  ["Groom + both", "Marié + les deux"],
  ["Groom name", "Nom du marié"],
  ["Guest file", "Fichier invité"],
  [
    "Guest prefers printed invitation only",
    "L’invité préfère uniquement l’invitation imprimée",
  ],
  ["Guest record", "Fiche invité"],
  ["Guest replies", "Réponses invités"],
  ["Guest-book review saved.", "Revue du livre d’or enregistrée."],
  [
    "Guests recorded as arrived by staff or scan workflow.",
    "Invités enregistrés comme arrivés par l’équipe ou le flux de scan.",
  ],
  [
    "Guests with active table assignments for this event.",
    "Invités avec affectations de table actives pour cet événement.",
  ],
  ["Improvement suggestions", "Suggestions d’amélioration"],
  [
    "Importing is staged so the team stays in control.",
    "L’import reste en préparation pour que l’équipe garde le contrôle.",
  ],
  ["Kept for the final book", "Conservé pour le livre final"],
  ["Last generated", "Dernière génération"],
  ["Latest note", "Dernière note"],
  ["Lifecycle rules", "Règles de cycle de vie"],
  ["Link account", "Lier le compte"],
  ["List name", "Nom de la liste"],
  ["List ownership", "Responsabilité de la liste"],
  ["Manual app handoff", "Passage manuel vers l’application"],
  ["Manual entry", "Saisie manuelle"],
  ["Manual payments", "Paiements manuels"],
  ["Manual recording", "Enregistrement manuel"],
  ["Manual recording mode", "Mode d’enregistrement manuel"],
  ["Manual sending checkpoint", "Point de contrôle de l’envoi manuel"],
  ["Manual WhatsApp control", "Contrôle WhatsApp manuel"],
  ["Mark failed", "Marquer comme échoué"],
  ["Mark opened", "Marquer comme ouvert"],
  ["Mark reviewed", "Marquer comme revu"],
  ["Mark sent", "Marquer comme envoyé"],
  ["Mark skipped", "Marquer comme ignoré"],
  ["Match CSV columns", "Associer les colonnes CSV"],
  ["Match columns.", "Associer les colonnes."],
  [
    "Match the recorded action name.",
    "Correspondre au nom d’action enregistré.",
  ],
  ["Matching records", "Dossiers correspondants"],
  ["Message status updated to", "Statut du message mis à jour à"],
  ["MFA protected", "Protégé par MFA"],
  ["Moderation saved", "Modération enregistrée"],
  [
    "Name the design so the team can recognize it later, then attach a PDF export no larger than",
    "Nommez le design pour que l’équipe le reconnaisse plus tard, puis joignez un export PDF ne dépassant pas",
  ],
  [
    "Name, phone, invitation ID, table",
    "Nom, téléphone, ID d’invitation, table",
  ],
  [
    "Names, phone numbers, and invitations stay protected.",
    "Les noms, numéros de téléphone et invitations restent protégés.",
  ],
  [
    "Narrow by the affected record family.",
    "Filtrer par famille de dossier concernée.",
  ],
  ["Need a decision", "Décision requise"],
  ["Needs attention", "Demande une attention"],
  ["Needs correction", "Correction requise"],
  ["Needs review", "Revue requise"],
  ["New version recorded", "Nouvelle version enregistrée"],
  ["Next actions", "Prochaines actions"],
  ["Next movement", "Prochain mouvement"],
  ["Next state", "Prochain état"],
  ["No action", "Aucune action"],
  ["No action available", "Aucune action disponible"],
  ["No addendums yet", "Aucun avenant pour le moment"],
  ["No arrival action available.", "Aucune action d’arrivée disponible."],
  ["No available work areas", "Aucune zone de travail disponible"],
  ["No catalog items yet", "Aucun élément de catalogue pour le moment"],
  ["No CSV generated yet", "Aucun CSV généré pour le moment"],
  ["No CSV headers found", "Aucun en-tête CSV trouvé"],
  ["No downstream areas available", "Aucune zone suivante disponible"],
  ["No events configured", "Aucun événement configuré"],
  ["No events yet", "Aucun événement pour le moment"],
  ["No files registered yet", "Aucun fichier enregistré pour le moment"],
  ["No immediate follow-up", "Aucun suivi immédiat"],
  ["No keepsake messages yet", "Aucun message souvenir pour le moment"],
  ["No linked accounts yet", "Aucun compte lié pour le moment"],
  ["No manual payments yet", "Aucun paiement manuel pour le moment"],
  ["No matching activity", "Aucune activité correspondante"],
  ["No messages prepared yet", "Aucun message préparé pour le moment"],
  ["No readiness tasks", "Aucune tâche de préparation"],
  ["No readiness tasks assigned", "Aucune tâche de préparation assignée"],
  ["No records yet", "Aucun dossier pour le moment"],
  ["No response data yet", "Aucune donnée de réponse pour le moment"],
  ["No signal recorded yet", "Aucun signal enregistré pour le moment"],
  ["No tables yet", "Aucune table pour le moment"],
  ["No wedding projects yet", "Aucun mariage pour le moment"],
  ["Not mapped", "Non associé"],
  ["Offline list", "Liste hors ligne"],
  ["Offline preload", "Préchargement hors ligne"],
  [
    "Offline records that need reconciliation.",
    "Dossiers hors ligne qui nécessitent une réconciliation.",
  ],
  ["Offline support", "Prise en charge hors ligne"],
  ["Open check-in", "Ouvrir l’accueil"],
  ["Open complete activity history", "Ouvrir l’historique d’activité complet"],
  ["Open invitations", "Ouvrir les invitations"],
  ["Open seating", "Ouvrir le placement"],
  ["Operating signals", "Signaux opérationnels"],
  ["Operational summaries", "Résumés opérationnels"],
  ["Optional add-ons", "Options facultatives"],
  ["Optional private note", "Note privée facultative"],
  ["Optional note", "Note facultative"],
  ["Optional testimonial", "Témoignage facultatif"],
  [
    "Outcome recording is restricted",
    "L’enregistrement du résultat est restreint",
  ],
  ["Package created", "Forfait créé"],
  ["Package description", "Description du forfait"],
  ["Package name", "Nom du forfait"],
  ["Package reference", "Référence du forfait"],
  ["Paid amount in cents", "Montant payé en centimes"],
  ["Partial arrivals", "Arrivées partielles"],
  ["Paste the scanned QR text", "Collez le texte QR scanné"],
  [
    "Payment confirmation is expected today",
    "La confirmation du paiement est attendue aujourd’hui",
  ],
  ["Payment confirmed", "Paiement confirmé"],
  ["Payment recorded", "Paiement enregistré"],
  [
    "PDF designs that still need guest fields placed.",
    "Designs PDF qui doivent encore recevoir les champs invités.",
  ],
  ["PDF registration", "Enregistrement PDF"],
  ["PDF-only registration", "Enregistrement PDF uniquement"],
  ["Percentage basis points", "Points de base du pourcentage"],
  ["Permission checked", "Permission vérifiée"],
  ["Permission granted", "Permission accordée"],
  ["Permission-scoped weddings", "Mariages limités par permission"],
  ["Place dynamic fields", "Placer les champs dynamiques"],
  [
    "Place dynamic fields on the PDF, generate a technical preview, approve the placement, then prepare guest invitation files for",
    "Placez les champs dynamiques sur le PDF, générez un aperçu technique, approuvez le placement, puis préparez les fichiers d’invitation invités pour",
  ],
  ["Place fields", "Placer les champs"],
  ["Prepared messages", "Messages préparés"],
  [
    "Prepared, queued, or failed messages needing attention.",
    "Messages préparés, en file ou échoués qui demandent une attention.",
  ],
  ["Prepared exports", "Exports préparés"],
  [
    "Prepare wedding submissions and follow assigned work for",
    "Préparer les soumissions de mariage et suivre le travail assigné pour",
  ],
  ["Preload list", "Précharger la liste"],
  ["Previous couple note", "Note précédente du couple"],
  ["Preview", "Aperçu"],
  ["Preview actions", "Actions d’aperçu"],
  ["Preview generated", "Aperçu généré"],
  ["Preview needed", "Aperçu requis"],
  ["Price adjustment saved", "Ajustement de prix enregistré"],
  ["Price estimate", "Estimation du prix"],
  ["Price in cents", "Prix en centimes"],
  ["Pricing calculation saved", "Calcul tarifaire enregistré"],
  ["Pricing mode", "Mode de tarification"],
  ["Primary contact email", "E-mail du contact principal"],
  ["Primary contact phone", "Téléphone du contact principal"],
  ["Private feedback", "Retour privé"],
  ["Protected changes", "Modifications protégées"],
  ["Public approved", "Approuvé pour publication"],
  ["Public display name", "Nom public affiché"],
  ["Public guest page QR/link", "QR/lien de page invité publique"],
  ["QR code text", "Texte du QR code"],
  ["QR lookup is not available", "La recherche QR n’est pas disponible"],
  ["QR reference", "Référence QR"],
  ["QR reference missing", "Référence QR manquante"],
  ["QR scan", "Scan QR"],
  ["QR scan lookup", "Recherche par scan QR"],
  ["QR scanning is disabled", "Le scan QR est désactivé"],
  [
    "Ratings help the team understand what went well and what needs improvement.",
    "Les évaluations aident l’équipe à comprendre ce qui a bien fonctionné et ce qui doit être amélioré.",
  ],
  ["Read only", "Lecture seule"],
  ["Reception invitation", "Invitation réception"],
  ["Record an updated file", "Enregistrer un fichier mis à jour"],
  ["Record arrival", "Enregistrer l’arrivée"],
  ["Record type", "Type de dossier"],
  ["Records waiting for sync.", "Dossiers en attente de synchronisation."],
  ["Recent weddings", "Mariages récents"],
  ["Reference note", "Note de référence"],
  ["Register invitation design", "Enregistrer le design d’invitation"],
  ["Registration is limited", "L’enregistrement est limité"],
  ["Reject testimonial", "Rejeter le témoignage"],
  ["Request changes", "Demander des modifications"],
  ["Request correction", "Demander une correction"],
  ["Response coverage", "Couverture des réponses"],
  ["Response tracking", "Suivi des réponses"],
  [
    "Retention controls are protected",
    "Les contrôles de conservation sont protégés",
  ],
  ["Retention due", "Conservation à traiter"],
  ["Retention ends", "Fin de conservation"],
  ["Retention starts", "Début de conservation"],
  ["Retention updated", "Conservation mise à jour"],
  ["Retention was not updated", "La conservation n’a pas été mise à jour"],
  ["Retire previous version", "Retirer la version précédente"],
  [
    "Return to column mapping if the CSV needs to be matched and validated again.",
    "Revenez à la correspondance des colonnes si le CSV doit être associé et validé de nouveau.",
  ],
  ["Return to operations", "Retour aux opérations"],
  ["Review RSVPs", "Revoir les RSVP"],
  ["Reviewable now", "Révisable maintenant"],
  ["Reviewer decision", "Décision du réviseur"],
  [
    "Reviews remain tied to the right operator.",
    "Les revues restent liées au bon opérateur.",
  ],
  ["Role-aware overview", "Vue limitée par rôle"],
  ["Room placement", "Placement dans la salle"],
  [
    "Rows that need review before response counts are trusted.",
    "Lignes à revoir avant de fiabiliser les compteurs de réponses.",
  ],
  ["Row decisions", "Décisions de lignes"],
  [
    "Row-level side can override this only when mapped.",
    "Le côté au niveau de la ligne peut le remplacer seulement s’il est associé.",
  ],
  ["RSVP progress", "Progression RSVP"],
  ["RSVP review", "Revue RSVP"],
  ["RSVP summary", "Résumé RSVP"],
  ["RSVP totals", "Totaux RSVP"],
  ["Saved wording", "Texte sauvegardé"],
  [
    "Save fields, then generate a placement preview.",
    "Enregistrez les champs, puis générez un aperçu du placement.",
  ],
  ["Scan could not be completed", "Le scan n’a pas pu être terminé"],
  ["Scan state", "État du scan"],
  ["Seat assignments", "Affectations de places"],
  ["Selection required", "Sélection requise"],
  ["Sending remains manual", "L’envoi reste manuel"],
  ["Sent result", "Résultat envoyé"],
  ["Service catalog", "Catalogue de services"],
  ["Session check", "Vérification de session"],
  ["Session state", "État de session"],
  [
    "Settings are read-only for your role",
    "Les paramètres sont en lecture seule pour votre rôle",
  ],
  ["Shared navigation", "Navigation partagée"],
  ["Shared progress highlights", "Points forts de progression partagée"],
  ["Shared view", "Vue partagée"],
  ["Sign-out did not finish", "La déconnexion n’a pas abouti"],
  [
    "Signals most likely to need same-day attention.",
    "Signaux les plus susceptibles de demander une attention le jour même.",
  ],
  ["Size in bytes", "Taille en octets"],
  ["Skip reason", "Raison de l’ignorance"],
  [
    "Some roles can reach records that need stronger session proof.",
    "Certains rôles peuvent accéder à des dossiers qui exigent une preuve de session plus forte.",
  ],
  ["Staff account reference", "Référence du compte équipe"],
  ["Starts at", "Commence à"],
  ["Station device", "Appareil du poste"],
  ["Station name", "Nom du poste"],
  ["Stations and offline", "Postes et hors ligne"],
  [
    "Submission creation is not available",
    "La création de soumission n’est pas disponible",
  ],
  ["Suggested improvements", "Améliorations suggérées"],
  [
    "Supabase is not configured for this environment, so CSV columns cannot be matched yet.",
    "Supabase n’est pas configuré pour cet environnement ; les colonnes CSV ne peuvent donc pas encore être associées.",
  ],
  [
    "Supabase is not configured for this environment, so response totals cannot be loaded yet.",
    "Supabase n’est pas configuré pour cet environnement ; les totaux de réponses ne peuvent donc pas encore être chargés.",
  ],
  ["Supervisor override", "Validation superviseur"],
  ["Sync alerts", "Alertes de synchronisation"],
  ["Table 1", "Table 1"],
  [
    "Table capacity and current seat assignments.",
    "Capacité des tables et affectations de places actuelles.",
  ],
  ["Tables", "Tables"],
  [
    "Tables, capacity, and active seat assignments.",
    "Tables, capacité et affectations de places actives.",
  ],
  ["Tablet 1", "Tablette 1"],
  ["Tag for operations", "Étiquette pour les opérations"],
  ["Team member", "Membre de l’équipe"],
  ["Team only", "Équipe uniquement"],
  ["Templates", "Modèles"],
  ["Testimonial permission:", "Autorisation de témoignage :"],
  ["Testimonial text", "Texte du témoignage"],
  ["Testimonial text provided", "Texte de témoignage fourni"],
  [
    "Testimonials require two approvals",
    "Les témoignages nécessitent deux approbations",
  ],
  [
    "The add-on is now available for event package selections.",
    "L’option est maintenant disponible pour les sélections de forfaits événement.",
  ],
  [
    "The addendum was recorded and is now visible in the contract change history.",
    "L’avenant a été enregistré et apparaît désormais dans l’historique des changements du contrat.",
  ],
  [
    "The archive action could not be saved. Check the reason and your access before trying again.",
    "L’action d’archivage n’a pas pu être enregistrée. Vérifiez la raison et votre accès avant de réessayer.",
  ],
  [
    "The archive action was recorded for this file and added to the file history.",
    "L’action d’archivage a été enregistrée pour ce fichier et ajoutée à son historique.",
  ],
  [
    "The comment could not be saved. Check that the message is filled in and that the visibility is allowed for your role.",
    "Le commentaire n’a pas pu être enregistré. Vérifiez que le message est rempli et que la visibilité est autorisée pour votre rôle.",
  ],
  [
    "The commercial change could not be saved.",
    "Le changement commercial n’a pas pu être enregistré.",
  ],
  [
    "The commercial change could not be saved. Review the required fields and your access before trying again.",
    "Le changement commercial n’a pas pu être enregistré. Vérifiez les champs requis et votre accès avant de réessayer.",
  ],
  [
    "The commercial change was saved.",
    "Le changement commercial a été enregistré.",
  ],
  [
    "The contract approval was recorded and guest-list access can follow the approved terms.",
    "L’approbation du contrat a été enregistrée et l’accès à la liste d’invités peut suivre les conditions approuvées.",
  ],
  [
    "The couple must grant permission first. Then an authorized Diginoces reviewer decides whether the text can be used publicly.",
    "Le couple doit d’abord donner son autorisation. Ensuite, un réviseur Diginoces autorisé décide si le texte peut être utilisé publiquement.",
  ],
  [
    "The couple review action could not be saved.",
    "L’action de revue du couple n’a pas pu être enregistrée.",
  ],
  [
    "The couple review decision was saved.",
    "La décision de revue du couple a été enregistrée.",
  ],
  [
    "The current price estimate was saved from the selected event packages.",
    "L’estimation de prix actuelle a été enregistrée à partir des forfaits événement sélectionnés.",
  ],
  [
    "The event package selection was saved and can be used for pricing.",
    "La sélection de forfait événement a été enregistrée et peut être utilisée pour la tarification.",
  ],
  [
    "The feedback action could not be saved.",
    "L’action de retour n’a pas pu être enregistrée.",
  ],
  [
    "The file record could not be added. Check the filename, format, size, and category before trying again.",
    "Le dossier de fichier n’a pas pu être ajouté. Vérifiez le nom, le format, la taille et la catégorie avant de réessayer.",
  ],
  [
    "The file record was added to this wedding. Open the record to review versions, downloads, and archive actions.",
    "Le fichier a été ajouté à ce mariage. Ouvrez le dossier pour vérifier les versions, téléchargements et actions d’archivage.",
  ],
  [
    "The guest-book action could not be completed.",
    "L’action du livre d’or n’a pas pu être terminée.",
  ],
  [
    "The manual payment was recorded and is ready for confirmation when required.",
    "Le paiement manuel a été enregistré et sera prêt pour confirmation au moment requis.",
  ],
  [
    "The payment was confirmed and the payment gate has been refreshed.",
    "Le paiement a été confirmé et le contrôle d’accès paiement a été actualisé.",
  ],
  [
    "The price adjustment was saved with its reason for audit review.",
    "L’ajustement de prix a été enregistré avec sa raison pour revue d’audit.",
  ],
  [
    "The project thread could not be updated. Try again, then contact the Diginoces team if the problem continues.",
    "Le fil du projet n’a pas pu être mis à jour. Réessayez, puis contactez l’équipe Diginoces si le problème continue.",
  ],
  [
    "The request was incomplete or invalid. Check the amounts, selections, and approval confirmations.",
    "La demande était incomplète ou invalide. Vérifiez les montants, sélections et confirmations d’approbation.",
  ],
  [
    "The retention decision could not be saved. Check the action, date, and reason before trying again.",
    "La décision de conservation n’a pas pu être enregistrée. Vérifiez l’action, la date et la raison avant de réessayer.",
  ],
  [
    "The retention decision was recorded for this wedding file vault.",
    "La décision de conservation a été enregistrée pour le coffre de fichiers de ce mariage.",
  ],
  [
    "The row needs clarification before a final decision.",
    "La ligne nécessite une clarification avant une décision finale.",
  ],
  [
    "The service package is now available for event selections.",
    "Le forfait de service est maintenant disponible pour les sélections événement.",
  ],
  [
    "The team can only approve public use when permission is granted and testimonial text is provided.",
    "L’équipe peut approuver l’usage public seulement si l’autorisation est accordée et que le texte de témoignage est fourni.",
  ],
  [
    "The temporary access exception was approved with its conditions.",
    "L’exception d’accès temporaire a été approuvée avec ses conditions.",
  ],
  [
    "The update was added to the project thread with the selected visibility.",
    "La mise à jour a été ajoutée au fil du projet avec la visibilité choisie.",
  ],
  [
    "The updated file record could not be saved. Check the filename, format, and size before trying again.",
    "Le fichier mis à jour n’a pas pu être enregistré. Vérifiez le nom, le format et la taille avant de réessayer.",
  ],
  [
    "The updated file record was added and the version history has been refreshed.",
    "Le fichier mis à jour a été ajouté et l’historique des versions a été actualisé.",
  ],
  [
    "This does not publish anything automatically. It only allows an authorized reviewer to approve it.",
    "Cela ne publie rien automatiquement. Cela permet seulement à un réviseur autorisé de l’approuver.",
  ],
  ["This file is currently", "Ce fichier est actuellement"],
  [
    "This guest page is not available here",
    "Cette page invitée n’est pas disponible ici",
  ],
  ["This page shows designs for", "Cette page affiche les designs pour"],
  [
    "This QR code could not be matched to a guest for",
    "Ce QR code n’a pas pu être associé à un invité pour",
  ],
  [
    "This scan is missing its QR reference. Scan again before confirming the arrival.",
    "Ce scan n’a pas sa référence QR. Scannez à nouveau avant de confirmer l’arrivée.",
  ],
  ["Thread summary", "Résumé du fil"],
  ["Token separation", "Séparation des jetons"],
  ["Total rows", "Total des lignes"],
  ["Traceability view", "Vue de traçabilité"],
  [
    "Track guest, RSVP, invitation, communication, seating, check-in, and commercial status for",
    "Suivre les invités, RSVP, invitations, communications, placement, accueil et statut commercial pour",
  ],
  [
    "Try again before leaving this device.",
    "Réessayez avant de quitter cet appareil.",
  ],
  [
    "Unexpected arrivals that need an operational decision.",
    "Arrivées inattendues qui nécessitent une décision opérationnelle.",
  ],
  [
    "Unexpected guest requests still waiting for a decision.",
    "Demandes d’invités inattendus encore en attente de décision.",
  ],
  [
    "Use this page to understand who changed what, when it happened, and which area of the platform produced the record.",
    "Utilisez cette page pour comprendre qui a changé quoi, quand cela s’est produit et quelle zone de la plateforme a produit le dossier.",
  ],
  ["User reference", "Référence utilisateur"],
  ["Validate preview", "Valider l’aperçu"],
  [
    "Validation finds missing fields, wrong sides, and possible duplicates.",
    "La validation détecte les champs manquants, les mauvais côtés et les doublons possibles.",
  ],
  ["Validation happens next", "La validation vient ensuite"],
  ["Valid rows", "Lignes valides"],
  ["Version controls are protected", "Les contrôles de version sont protégés"],
  ["Version set", "Version définie"],
  ["Version was not recorded", "La version n’a pas été enregistrée"],
  ["VIP table cards", "Cartons de table VIP"],
  ["VIP/protocol notes", "Notes VIP/protocole"],
  [
    "Verification is not connected yet",
    "La vérification n’est pas encore connectée",
  ],
  [
    "Visible to authorized Diginoces users only.",
    "Visible uniquement par les utilisateurs Diginoces autorisés.",
  ],
  ["Visible to you", "Visible pour vous"],
  ["Waiting on Diginoces", "En attente de Diginoces"],
  ["WhatsApp number", "Numéro WhatsApp"],
  ["WhatsApp opened", "WhatsApp ouvert"],
  ["WhatsApp phone", "Téléphone WhatsApp"],
  ["WhatsApp preparation", "Préparation WhatsApp"],
  ["Why this step appears", "Pourquoi cette étape apparaît"],
  ["Wording saved", "Texte enregistré"],
  ["Wording version", "Version du texte"],
  [
    "Write the update that should stay attached to this wedding.",
    "Rédigez la mise à jour qui doit rester attachée à ce mariage.",
  ],
  ["Wrong number provided", "Mauvais numéro fourni"],
  [
    "Your role does not allow that file action. Ask a Diginoces administrator if this access should change.",
    "Votre rôle ne permet pas cette action sur les fichiers. Demandez à un administrateur Diginoces si cet accès doit changer.",
  ],
  [
    ": guest list readiness and RSVP movement without staff-only operational details.",
    " : préparation de la liste d’invités et progression RSVP sans détails opérationnels réservés à l’équipe.",
  ],
  ["cannot be decided here", "ne peut pas être décidé ici"],
  ["configured for this design.", "configurés pour ce design."],
  ["currently matched", "actuellement associé"],
  ["errors /", "erreurs /"],
  ["generated /", "générés /"],
  ["ready /", "prêts /"],
  ["received across", "reçues sur"],
] as const;

const supplementalExactEnglishToFrench = defineExactTranslations(
  "supplementalExactEnglishToFrench",
  supplementalExactEnglishToFrenchEntries,
);

function assertNoExactKeyOverlap(
  base: Record<string, string>,
  supplemental: Record<string, string>,
) {
  const overlap = Object.keys(supplemental).filter((key) =>
    Object.prototype.hasOwnProperty.call(base, key),
  );

  if (overlap.length > 0) {
    throw new Error(
      `Duplicate exact translation keys found in supplemental map: ${overlap.join(", ")}`,
    );
  }
}

type ExactTranslationEntries = readonly (readonly [string, string])[];

function assertUniqueExactTranslationKeys(
  label: string,
  entries: ExactTranslationEntries,
) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  entries.forEach(([key]) => {
    if (seen.has(key)) {
      duplicates.push(key);
      return;
    }

    seen.add(key);
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate exact translation keys found in ${label}: ${duplicates.join(", ")}`,
    );
  }
}

function defineExactTranslations<const Entries extends ExactTranslationEntries>(
  label: string,
  entries: Entries,
) {
  assertUniqueExactTranslationKeys(label, entries);

  const translations: Record<string, string> = Object.create(null);

  entries.forEach(([key, value]) => {
    translations[key] = value;
  });

  return translations as {
    [Entry in Entries[number] as Entry[0]]: Entry[1];
  };
}

function mergeExactTranslations<
  Base extends Record<string, string>,
  Supplemental extends Record<string, string>,
>(base: Base, supplemental: Supplemental) {
  const translations: Record<string, string> = Object.create(null);

  Object.entries(base).forEach(([key, value]) => {
    translations[key] = value;
  });
  Object.entries(supplemental).forEach(([key, value]) => {
    translations[key] = value;
  });

  return translations as Base & Supplemental;
}

assertNoExactKeyOverlap(
  baseExactEnglishToFrench,
  supplementalExactEnglishToFrench,
);

const exactEnglishToFrench = mergeExactTranslations(
  baseExactEnglishToFrench,
  supplementalExactEnglishToFrench,
);

/**
 * Ordered phrase replacements applied after exact matches fail.
 * If a new phrase is a substring of another phrase, keep the longer phrase
 * first so sequential replaceAll calls do not break the longer translation.
 */
const phraseEnglishToFrench = [
  [
    "Start with the wedding or work area available to this account.",
    "Commencez par le mariage ou la zone de travail accessible à ce compte.",
  ],
  [
    "Manage partner records and the partner work areas connected to Diginoces delivery.",
    "Gérez les partenaires et les zones de travail partenaires liées à la livraison Diginoces.",
  ],
  [
    "Add anything Diginoces should review before assigning the wedding.",
    "Ajoutez tout ce que Diginoces doit revoir avant d’assigner le mariage.",
  ],
  [
    "Approved or assigned weddings will appear here after Diginoces connects them to this partner profile.",
    "Les mariages approuvés ou assignés apparaîtront ici après leur liaison à ce profil partenaire par Diginoces.",
  ],
  [
    "Approved profiles will appear here after secure workspace access is ready.",
    "Les profils approuvés apparaîtront ici lorsque l’accès sécurisé à l’espace sera prêt.",
  ],
  [
    "Assigned weddings and partner submissions will appear here after secure workspace access is ready.",
    "Les mariages assignés et soumissions partenaires apparaîtront ici lorsque l’accès sécurisé à l’espace sera prêt.",
  ],
  [
    "Capture the couple and planning notes. Diginoces reviews the submission before connecting it to an operational wedding.",
    "Saisissez le couple et les notes de planification. Diginoces revoit la soumission avant de la lier à un mariage opérationnel.",
  ],
  [
    "Changes after submission should be coordinated with Diginoces so the review trail stays clear.",
    "Les changements après soumission doivent être coordonnés avec Diginoces afin que la trace de revue reste claire.",
  ],
  [
    "Connect the workspace before loading partner assignments.",
    "Connectez l’espace avant de charger les assignations partenaires.",
  ],
  [
    "Connect the workspace before loading partner records.",
    "Connectez l’espace avant de charger les dossiers partenaires.",
  ],
  [
    "Connect the workspace before loading submitted partner projects.",
    "Connectez l’espace avant de charger les mariages soumis par les partenaires.",
  ],
  [
    "Follow operational weddings connected to this partner profile.",
    "Suivez les mariages opérationnels liés à ce profil partenaire.",
  ],
  [
    "Include dates, venues, expected events, and timing notes.",
    "Incluez dates, lieux, événements prévus et notes de calendrier.",
  ],
  [
    "Link this account to a partner profile before wedding submissions and assigned work can be shown here.",
    "Liez ce compte à un profil partenaire avant d’afficher ici les soumissions et travaux assignés.",
  ],
  [
    "New wedding submissions appear here after they are created.",
    "Les nouvelles soumissions de mariage apparaissent ici après leur création.",
  ],
  [
    "Partner profiles will appear here when this account has access to them.",
    "Les profils partenaires apparaîtront ici lorsque ce compte y aura accès.",
  ],
  [
    "Partner work becomes available after this account is linked to a profile.",
    "Le travail partenaire devient disponible après liaison de ce compte à un profil.",
  ],
  [
    "This note is kept with the partner review history.",
    "Cette note est conservée avec l’historique de revue partenaire.",
  ],
  [
    "Track wedding submissions from first draft through Diginoces review.",
    "Suivez les soumissions de mariage du premier brouillon jusqu’à la revue Diginoces.",
  ],
  [
    "You can still review assigned weddings and existing submissions visible to this partner profile.",
    "Vous pouvez toujours consulter les mariages assignés et soumissions existantes visibles pour ce profil partenaire.",
  ],
  [
    "Review portfolio-wide progress, operational attention areas, and summary activity when your role allows it.",
    "Consultez la progression globale, les points d’attention et l’activité résumée lorsque votre rôle l’autorise.",
  ],
  [
    "Check operational reports and exports used for planning, oversight, and delivery reviews.",
    "Consultez les rapports et exports utilisés pour la planification, le suivi et les revues de livraison.",
  ],
  [
    "Activity exports include source, action, record type, record reference, actor, reason, and time. Old and new value payloads are not exposed here.",
    "Les exports d’activité incluent source, action, type de dossier, référence, personne, raison et heure. Les anciennes et nouvelles valeurs ne sont pas exposées ici.",
  ],
  [
    "Activity history will appear after the workspace connection is ready.",
    "L’historique apparaîtra lorsque la connexion de l’espace sera prête.",
  ],
  [
    "Activity trails keep sensitive changes traceable.",
    "Les historiques gardent les changements sensibles traçables.",
  ],
  [
    "Ask an administrator to finish the workspace connection before using protected Diginoces areas.",
    "Demandez à un administrateur de terminer la connexion de l’espace avant d’utiliser les zones Diginoces protégées.",
  ],
  [
    "Audit data stays closed until the secure workspace connection is ready.",
    "Les données d’audit restent fermées jusqu’à ce que la connexion sécurisée soit prête.",
  ],
  [
    "Create a CSV for the current filters. Use it for operational review, handoff, or incident investigation.",
    "Créez un CSV pour les filtres actuels. Utilisez-le pour revue opérationnelle, transmission ou investigation d’incident.",
  ],
  [
    "Reporting stays closed until the secure workspace connection is ready.",
    "Les rapports restent fermés jusqu’à ce que la connexion sécurisée soit prête.",
  ],
  [
    "Review source, action, record type, actor, and time for the latest matching activity.",
    "Revoyez source, action, type de dossier, acteur et heure pour la dernière activité correspondante.",
  ],
  [
    "Review the latest matching records before exporting an activity handoff.",
    "Revoyez les derniers dossiers correspondants avant d’exporter une transmission d’activité.",
  ],
  [
    "Search across visible audit fields.",
    "Recherchez dans les champs d’audit visibles.",
  ],
  [
    "Search team and system activity by action, record type, team member, date, or text. Exports keep sensitive change details hidden for safer handoff.",
    "Recherchez l’activité équipe et système par action, type de dossier, membre, date ou texte. Les exports gardent les détails sensibles masqués pour une transmission plus sûre.",
  ],
  [
    "Sensitive change details were hidden in the exported file.",
    "Les détails sensibles des changements ont été masqués dans le fichier exporté.",
  ],
  [
    "The export was generated and added to the report history below.",
    "L’export a été généré et ajouté à l’historique ci-dessous.",
  ],
  [
    "Use one or more filters to narrow the activity history. Leave fields blank to see the latest records your role can read.",
    "Utilisez un ou plusieurs filtres pour réduire l’historique. Laissez les champs vides pour voir les derniers dossiers lisibles par votre rôle.",
  ],
  [
    "You can review activity history, but your role cannot create audit exports from this page.",
    "Vous pouvez consulter l’historique, mais votre rôle ne peut pas créer d’exports d’audit depuis cette page.",
  ],
  [
    "Open the partner-facing view for work assigned to an external delivery partner.",
    "Ouvrez la vue partenaire pour le travail confié à un partenaire externe.",
  ],
  [
    "Create and open each couple's main workspace with dates, codes, status, and team access.",
    "Créez et ouvrez l’espace principal de chaque couple avec dates, codes, statut et accès équipe.",
  ],
  [
    "Track ceremonies, receptions, brunches, and other events inside the selected wedding.",
    "Suivez les cérémonies, réceptions, brunchs et autres événements dans le mariage sélectionné.",
  ],
  [
    "Keep staff, partners, couple users, and event teams scoped to the right work.",
    "Gardez le personnel, les partenaires, les couples et les équipes événement dans le bon périmètre.",
  ],
  [
    "Create, edit, filter, and organize guests by side, title, tag, and event assignment.",
    "Créez, modifiez, filtrez et organisez les invités par côté, titre, tag et événement.",
  ],
  [
    "Stage CSV uploads, map columns, preview warnings, and review rows before guests are created.",
    "Préparez les CSV, associez les colonnes, vérifiez les alertes et relisez les lignes avant création des invités.",
  ],
  [
    "Bring spreadsheet guest lists into the project, validate rows, review decisions, and add only approved guests to the active list.",
    "Importez les listes d’invités depuis un tableur, validez les lignes, revoyez les décisions et ajoutez seulement les invités approuvés à la liste active.",
  ],
  [
    "Open an import to confirm mapping, review rows, or apply approved guests.",
    "Ouvrez un import pour confirmer les colonnes, relire les lignes ou ajouter les invités approuvés.",
  ],
  ["Open partner profile:", "Ouvrir le profil partenaire :"],
  ["Generate CSV export for", "Générer l’export CSV pour"],
  ["Event reference :", "Référence de l’événement :"],
  ["Project reference :", "Référence du mariage :"],
  ["Preview approved", "Aperçu approuvé"],
  ["Preview approval", "Approbation de l’aperçu"],
  ["Generated files", "Fichiers générés"],
  ["Placement is approved", "Le placement est approuvé"],
  [
    "ready for guest file generation",
    "prêt pour la génération des fichiers invités",
  ],
  ["Text/Plain", "Texte brut"],
  ["Open record", "Ouvrir le dossier"],
  ["Open message queue", "Ouvrir la file de messages"],
  ["Open mapping", "Ouvrir la correspondance"],
  ["Apply archive action to", "Appliquer l’action d’archivage à"],
  ["Record an updated file for", "Enregistrer un fichier mis à jour pour"],
  ["Download file", "Télécharger le fichier"],
  ["Back to the wedding file vault from", "Retour au coffre du mariage depuis"],
  ["Cancel editing", "Annuler la modification de"],
  [
    "Guest import remains controlled before guests are added.",
    "L’import d’invités reste contrôlé avant tout ajout à la liste.",
  ],
  [
    "Include the header row so Diginoces can suggest column matches. Paste rows only when you are not uploading a file.",
    "Incluez la ligne d’en-tête pour que Diginoces suggère les correspondances. Collez des lignes seulement si vous n’importez pas de fichier.",
  ],
  ["Open CSV import", "Ouvrir l’import CSV"],
  ["1 wedding", "1 mariage"],
  ["1 row", "1 ligne"],
  ["2 rows", "2 lignes"],
  ["1 template", "1 modèle"],
  ["1 comment", "1 commentaire"],
  ["1 partner-visible note", "1 note visible par les partenaires"],
  [
    "Collect event-level responses through each guest's secure public page.",
    "Collectez les réponses par événement depuis la page personnelle sécurisée de chaque invité.",
  ],
  [
    "Register event invitation designs, configure guest fields, approve previews, and generate files.",
    "Enregistrez les designs d’invitation, configurez les champs invités, approuvez les aperçus et générez les fichiers.",
  ],
  [
    "Prepare French and English WhatsApp text, guided manual sends, follow-ups, and communication history.",
    "Préparez les textes WhatsApp français et anglais, les envois manuels guidés, les relances et l’historique.",
  ],
  [
    "Prepare WhatsApp text, guided sends, follow-ups, and message history.",
    "Préparez les textes WhatsApp, les envois guidés, les relances et l’historique des messages.",
  ],
  [
    "Open a guest's secure page preview without mixing it with staff-only access.",
    "Ouvrez l’aperçu sécurisé d’un invité sans le mélanger avec l’accès interne.",
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
    "Scan cross-wedding activity, open recent project workspaces, and move into reports or the audit trail when a signal needs deeper review.",
    "Parcourez l’activité entre mariages, ouvrez les espaces récemment mis à jour et passez aux rapports ou à l’historique lorsqu’un signal demande une revue approfondie.",
  ],
  [
    "Role-aware totals across weddings, events, imports, messages, contracts, reports, and guest operations.",
    "Totaux limités par rôle sur les mariages, événements, imports, messages, contrats, rapports et opérations invités.",
  ],
  [
    "Open the most recently updated projects and continue from their project dashboard.",
    "Ouvrez les mariages récemment mis à jour et continuez depuis leur tableau de bord.",
  ],
  [
    "Latest workspace actions visible to your role.",
    "Dernières actions de l’espace visibles pour votre rôle.",
  ],
  [
    "Use requested changes when the partner should correct the submission first.",
    "Utilisez les changements demandés quand le partenaire doit d’abord corriger la soumission.",
  ],
  [
    "Assign tables, review seating maps, and prepare printable event materials.",
    "Attribuez les tables, vérifiez les plans de salle et préparez les supports imprimables.",
  ],
  [
    "Use check-in controls and scan flows from the event workspace when the guest list is ready.",
    "Utilisez les contrôles d’accueil et le scan depuis l’événement lorsque la liste est prête.",
  ],
  [
    "Guest lists waiting for validation or approval.",
    "Listes d’invités en attente de validation ou d’approbation.",
  ],
  [
    "Open the most recently updated projects and continue from the right workspace.",
    "Ouvrez les mariages récemment mis à jour et continuez depuis le bon espace.",
  ],
  [
    "Each export is scoped to the current workspace, wedding, or event context.",
    "Chaque export est limité au contexte actuel de l’espace, du mariage ou de l’événement.",
  ],
  [
    "Wedding and event reports unlock when this page is opened from the matching workspace.",
    "Les rapports mariage et événement se déverrouillent quand cette page est ouverte depuis l’espace correspondant.",
  ],
  [
    "Use the overview to choose the right operational surface.",
    "Utilisez la vue d’ensemble pour choisir la bonne zone opérationnelle.",
  ],
  [
    "This page is for triage. Open the wedding, report, or activity history when you need to act.",
    "Cette page sert au triage. Ouvrez le mariage, le rapport ou l’historique quand vous devez agir.",
  ],
  [
    "Keep project and event files organized with retention and access controls.",
    "Gardez les fichiers du mariage et des événements organisés avec conservation et contrôle d’accès.",
  ],
  [
    "Review commercial controls, pricing exceptions, approvals, and project delivery evidence.",
    "Vérifiez les contrôles commerciaux, exceptions tarifaires, approbations et preuves de livraison.",
  ],
  [
    "Use dashboards and reports when your role includes operational or management visibility.",
    "Utilisez les tableaux de bord et rapports lorsque votre rôle donne cette visibilité.",
  ],
  [
    "Trace sensitive actions through protected logs when your role includes audit access.",
    "Suivez les actions sensibles dans les journaux protégés lorsque votre rôle y donne accès.",
  ],
  ["Send the right message", "Envoyer le bon message"],
  ["Run the event day", "Piloter le jour J"],
  ["For approved roles", "Pour les rôles approuvés"],
  ["Commercial:", "Contrats et paiements :"],
  [
    "Missing weddings usually mean the project membership or role needs review.",
    "Un mariage manquant indique souvent qu’une appartenance ou un rôle doit être revu.",
  ],
  [
    "Review project activity, guest progress, RSVP movement, and operational signals.",
    "Revoyez l’activité du mariage, la progression invités, les RSVP et les signaux opérationnels.",
  ],
  [
    "Open the couple-facing view for a simpler project summary.",
    "Ouvrez la vue couple pour un résumé plus simple du mariage.",
  ],
  [
    "Open project-scoped reporting and exports available to this account.",
    "Ouvrez les rapports et exports de ce mariage accessibles à ce compte.",
  ],
  [
    "Manage names, sides, tags, title types, event assignments, and guest profiles.",
    "Gérez les noms, côtés, tags, titres, affectations événement et fiches invités.",
  ],
  [
    "Review uploaded CSV rows before they are added to the guest list.",
    "Relisez les lignes CSV importées avant leur ajout à la liste d’invités.",
  ],
  [
    "Use dashboards and reports to understand where this wedding stands.",
    "Utilisez les tableaux de bord et rapports pour comprendre où en est ce mariage.",
  ],
  [
    "Event-level exports are available because this page was opened with an event context.",
    "Les exports par événement sont disponibles car cette page a été ouverte avec un contexte événement.",
  ],
  [
    "Wedding-level exports are available because this page was opened with a project context.",
    "Les exports par mariage sont disponibles car cette page a été ouverte avec un contexte mariage.",
  ],
  [
    "Workspace exports are available here. Open reports from a wedding or event page to unlock scoped exports.",
    "Les exports de l’espace sont disponibles ici. Ouvrez les rapports depuis un mariage ou un événement pour débloquer les exports ciblés.",
  ],
  [
    "Generate operational CSV exports from the reporting catalog your role can access.",
    "Générez des exports CSV opérationnels depuis le catalogue de rapports accessible à votre rôle.",
  ],
  [
    "Choose a report that matches the current scope.",
    "Choisissez un rapport qui correspond au périmètre actuel.",
  ],
  [
    "Report data will appear after the workspace connection is ready.",
    "Les données de rapport apparaîtront quand la connexion de l’espace sera prête.",
  ],
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
  ["Start date for the audit window.", "Date de début de la période d’audit."],
  [
    "Create a CSV for the current filters.",
    "Créez un CSV pour les filtres actuels.",
  ],
  [
    "Use project pages for operational work; activity will appear here when auditable actions are visible to this role.",
    "Utilisez les pages projet pour le travail opérationnel ; l’activité apparaîtra ici quand les actions auditables seront visibles pour ce rôle.",
  ],
  [
    "Use this page to understand who changed what, when it happened, and why it matters.",
    "Utilisez cette page pour comprendre qui a changé quoi, quand, et pourquoi c’est important.",
  ],
  [
    "Open from a matching wedding or event.",
    "Ouvrir depuis le mariage ou l’événement correspondant.",
  ],
  [
    "Build the guest list, review imports, collect responses, and prepare messages.",
    "Construisez la liste d’invités, relisez les imports, collectez les réponses et préparez les messages.",
  ],
  [
    "Keep the project moving with files, commercial controls, partner comments, and post-event work.",
    "Faites avancer le mariage avec les fichiers, contrôles commerciaux, commentaires partenaires et suivi après événement.",
  ],
  [
    "Track event-level Yes, No, Maybe, and pending responses.",
    "Suivez les réponses Oui, Non, Peut-être et en attente par événement.",
  ],
  [
    "Manage project files, event files, guest-facing downloads, and retention review.",
    "Gérez les fichiers du mariage, fichiers événement, téléchargements invités et revues de conservation.",
  ],
  [
    "Review packages, contract status, payments, and guest-page gates.",
    "Vérifiez les forfaits, contrats, paiements et accès aux pages invités.",
  ],
  [
    "Coordinate project notes with authorized staff and partners.",
    "Coordonnez les notes du mariage avec le personnel et les partenaires autorisés.",
  ],
  [
    "Moderate guest wishes and prepare guest-book content.",
    "Modérez les messages invités et préparez le contenu du livre d’or.",
  ],
  [
    "Review private post-event feedback and testimonial permission.",
    "Vérifiez les retours privés après événement et les autorisations de témoignage.",
  ],
  [
    "Move from this view into project records or reports.",
    "Passez de cette vue aux dossiers du mariage ou aux rapports.",
  ],
  [
    "Each workstream summarizes recorded activity for this wedding.",
    "Chaque volet résume l’activité enregistrée pour ce mariage.",
  ],
  [
    "Return to the wider project workspace when you need staff tools.",
    "Retournez à l’espace complet du mariage lorsque vous avez besoin des outils équipe.",
  ],
  [
    "Invites counted across every event.",
    "Invitations comptées sur tous les événements.",
  ],
  [
    "Review pending replies and uncertain responses before closing event counts.",
    "Revoyez les réponses en attente et incertaines avant de clôturer les comptes.",
  ],
  [
    "Track event-specific RSVP progress, response mix, and the guests who still need a reply or team review.",
    "Suivez l’avancement RSVP par événement, la répartition des réponses et les invités qui attendent encore une réponse ou une revue équipe.",
  ],
  [
    "How much of the current invited event list has answered.",
    "Part de la liste invitée actuelle qui a déjà répondu.",
  ],
  [
    "Uploaded lists kept for review history.",
    "Listes importées conservées pour l’historique de revue.",
  ],
  [
    "Rows ready for review or approval.",
    "Lignes prêtes pour revue ou approbation.",
  ],
  [
    "Rows read from uploaded CSV files.",
    "Lignes lues depuis les fichiers CSV importés.",
  ],
  ["2 guests still need a reply.", "2 invités doivent encore répondre."],
  ["3 guests still need a reply.", "3 invités doivent encore répondre."],
  [
    "Open the next area of work for this wedding.",
    "Ouvrez la prochaine zone de travail pour ce mariage.",
  ],
  [
    "Open an event for invitations, seating, check-in, files, and event-level dashboards.",
    "Ouvrez un événement pour les invitations, le placement, l’accueil, les fichiers et les tableaux événement.",
  ],
  [
    "Project tasks that keep guest, invitation, seating, and event-day work on track.",
    "Tâches qui gardent les invités, invitations, placement et opérations du jour J sur la bonne voie.",
  ],
  [
    "Use the visible work areas above to continue guest, RSVP, invitation, messaging, seating, or file work.",
    "Utilisez les zones visibles ci-dessus pour continuer le travail invités, RSVP, invitations, messages, placement ou fichiers.",
  ],
  [
    "Work areas, events, and actions are limited to what your role can access.",
    "Les zones de travail, événements et actions sont limités à votre rôle.",
  ],
  [
    "Missing destinations usually mean the project membership or role assignment needs review.",
    "Une destination manquante indique souvent que l’accès au mariage ou le rôle doit être revu.",
  ],
  [
    "Start with guest list readiness when available, then move into RSVP, invitations, messages, seating, and check-in as the event approaches.",
    "Commencez par la préparation de la liste d’invités, puis avancez vers RSVP, invitations, messages, placement et accueil à l’approche de l’événement.",
  ],
  [
    "Start with wedding projects when you need the full context, or use the available work areas above when the next action is already clear.",
    "Commencez par les mariages lorsque vous avez besoin du contexte complet, ou utilisez les zones disponibles ci-dessus si la prochaine action est déjà claire.",
  ],
  [
    "Find a wedding, check its state, and open the next work area.",
    "Trouvez un mariage, vérifiez son état et ouvrez la prochaine zone de travail.",
  ],
  [
    "The wedding most recently touched by your account scope.",
    "Le mariage le plus récemment suivi dans le périmètre de ce compte.",
  ],
  [
    "Use the latest movement area for triage, then rely on the table when comparing status, references, and next steps across weddings.",
    "Utilisez la dernière activité pour trier, puis le tableau pour comparer les statuts, références et prochaines étapes des mariages.",
  ],
  [
    "Guest-list access opens after the project contract is approved in the app.",
    "La liste d’invités s’ouvre après l’approbation du contrat du mariage dans l’application.",
  ],
  [
    "Guest work is waiting on contract approval. A permitted couple member needs to approve the latest generated contract before this list opens for bride and groom users.",
    "Le travail invité attend l’approbation du contrat. Un membre du couple autorisé doit approuver le dernier contrat généré avant l’ouverture de cette liste aux mariés.",
  ],
  ["Updated", "Mis à jour"],
  ["Needs setup or review", "Configuration ou revue requise"],
  ["Contract approval required", "Approbation du contrat requise"],
  ["Review project profile", "Revoir le profil du mariage"],
  ["Create initial event plan", "Créer le premier plan événement"],
  ["Confirm project team access", "Confirmer l’accès de l’équipe projet"],
  ["Plan and review guidance", "Aide planification et revue"],
  ["Prepare guests guidance", "Aide préparation des invités"],
  ["Deliver and coordinate guidance", "Aide livraison et coordination"],
  ["Open for daily work", "Ouvert pour le travail quotidien"],
  ["Project reference:", "Référence mariage :"],
  ["Event reference:", "Référence événement :"],
  ["Open dashboard for", "Ouvrir le tableau de bord de"],
  ["Open reports for", "Ouvrir les rapports pour"],
  ["Open couple-facing view for", "Ouvrir la vue couple pour"],
  ["Open guest list for", "Ouvrir la liste d’invités pour"],
  ["Open Event", "Ouvrir l’événement"],
  ["Status:", "Statut :"],
  ["Next step:", "Prochaine étape :"],
  ["Last update:", "Dernière mise à jour :"],
  ["Reports:", "Rapports :"],
  ["Files:", "Fichiers :"],
  ["Feedback:", "Retours :"],
  ["Back to project overview for", "Retour à la vue du mariage pour"],
  ["Back to guest list for", "Retour à la liste d’invités pour"],
  ["Open contract controls for", "Ouvrir les contrôles contrat pour"],
  ["Upload a CSV guest list for", "Importer une liste CSV pour"],
  ["Visible to you:", "Visible pour vous :"],
  ["In preparation:", "En préparation :"],
  ["Operational:", "Opérationnel :"],
  ["Ready:", "Prêt :"],
  [
    "Start the wedding operation from one accountable place.",
    "Lancez l’opération du mariage depuis un seul espace responsable.",
  ],
  [
    "Open a wedding workspace, then move into events, guests, invitations, messages, seating, files, and event-day work.",
    "Ouvrez un espace mariage, puis avancez vers les événements, invités, invitations, messages, plans de table, fichiers et opérations du jour J.",
  ],
  ["Printed invitation only", "Invitation imprimée uniquement"],
  [
    "Invitation designs may include a public guest page QR or link. That guest link is separate from future event-day check-in tokens.",
    "Les designs d’invitation peuvent inclure un QR ou lien vers la page invitée publique. Ce lien invité reste séparé des futurs jetons d’accueil du jour J.",
  ],
  ["Open Invitation design", "Ouvrir le design d’invitation"],
  ["Invitation designs for", "Designs d’invitation pour"],
  ["Register a PDF design for", "Enregistrer un design PDF pour"],
  ["Guest-book review for", "Revue du livre d’or pour"],
  ["Messages for the keepsake", "Messages du souvenir"],
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
  ["Event workspace", "Espace événement"],
  ["Dashboard snapshot", "Instantané du tableau de bord"],
  ["Dashboard access is event-scoped", "Accès au tableau limité à l’événement"],
  ["Event signals", "Signaux de l’événement"],
  ["Invited guests", "Invités attendus"],
  ["Unexpected guests waiting", "Invités inattendus en attente"],
  ["Guest movement", "Mouvements invités"],
  ["Invitation design", "Design d’invitation"],
  ["Seating plan", "Plan de table"],
  ["Partner dashboard", "Tableau de bord partenaire"],
  ["Wedding update thread", "Fil d’actualité du mariage"],
  ["Contracts, pricing, and payments", "Contrats, tarifs et paiements"],
  ["Custom message wording", "Texte personnalisé"],
  ["Custom message", "Message personnalisé"],
  ["Prepare WhatsApp messages", "Préparer les messages WhatsApp"],
  [
    "Prepare reusable guest message wording",
    "Préparer les textes invités réutilisables",
  ],
  ["Event feedback and testimonials", "Retours et témoignages"],
  ["Wedding file vault", "Coffre-fort des fichiers du mariage"],
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
    "Prepare guest messages, review them, and record manual sending.",
    "Préparez les messages invités, relisez-les et enregistrez l’envoi manuel.",
  ],
  [
    "Diginoces prepares and records messages. The team still opens WhatsApp and confirms the outcome.",
    "Diginoces prépare et enregistre les messages. L’équipe ouvre toujours WhatsApp et confirme le résultat.",
  ],
  ["Waiting to send", "En attente d’envoi"],
  ["Manual follow-up queue", "File de suivi manuel"],
  ["Available movement", "Mouvements disponibles"],
  ["Based on your project role", "Selon votre rôle sur le mariage"],
  [
    "Messages waiting for manual action",
    "Messages en attente d’une action manuelle",
  ],
  ["Guided manual send", "Envoi manuel guidé"],
  [
    "Queue opens the message preparation workspace.",
    "La file ouvre l’espace de préparation des messages.",
  ],
  ["Good sending rhythm", "Bon rythme d’envoi"],
  [
    "Use templates for repeatable wording and message logs for accountability. A guest should never be marked sent until a team member confirms the manual send.",
    "Utilisez les modèles pour des textes réutilisables et les historiques de messages pour la traçabilité. Un invité ne doit jamais être marqué envoyé avant confirmation manuelle par l’équipe.",
  ],
  [
    "If a message fails, record the reason so operations can decide whether to correct the number or use a printed invitation path.",
    "Si un message échoue, notez la raison pour que les opérations décident s’il faut corriger le numéro ou utiliser une invitation imprimée.",
  ],
  ["Recent communication history", "Historique récent des communications"],
  [
    "Open a prepared message to review its text, WhatsApp link, and final recorded outcome.",
    "Ouvrez un message préparé pour vérifier son texte, son lien WhatsApp et le résultat final enregistré.",
  ],
  [
    "Uploaded files are parsed into review rows; source files are not persisted here.",
    "Les fichiers importés sont transformés en lignes de revue ; les fichiers source ne sont pas conservés ici.",
  ],
  ["Uploaded", "Importé le"],
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
  [
    "Register, classify, and retain contracts, invitations, exports, and reports for this wedding. Each record keeps visibility, version, and archive context in one place.",
    "Enregistrez, classez et conservez les contrats, invitations, exports et rapports de ce mariage. Chaque dossier garde la visibilité, la version et le contexte d’archive au même endroit.",
  ],
  [
    "Search the protected record set for this wedding. Open a file to review versions, downloads, and archive decisions.",
    "Recherchez dans les dossiers protégés de ce mariage. Ouvrez un fichier pour revoir les versions, téléchargements et décisions d’archive.",
  ],
  ["Contract addendum", "Avenant au contrat"],
  ["Payment proof", "Preuve de paiement"],
  ["Invitation template", "Modèle d’invitation"],
  ["Guest-book export", "Export livre d’or"],
  ["Check-in export", "Export accueil"],
  ["Project archive", "Archive du mariage"],
  [
    "Add the file metadata the team needs before anyone opens or shares it. Visibility and event scope are saved with the record.",
    "Ajoutez les métadonnées dont l’équipe a besoin avant ouverture ou partage. La visibilité et le périmètre événement sont enregistrés avec le dossier.",
  ],
  [
    "Choose a file when it is ready, or save the record details now and attach the file later.",
    "Choisissez un fichier lorsqu’il est prêt, ou enregistrez les détails maintenant et joignez le fichier plus tard.",
  ],
  ["Where this file belongs", "Périmètre de ce fichier"],
  [
    "Lifecycle decisions recorded for this wedding file vault.",
    "Décisions de cycle de vie enregistrées pour le coffre-fort fichiers du mariage.",
  ],
  ["No retention history yet", "Aucun historique de conservation"],
  [
    "Archive and cleanup decisions will appear after a lifecycle action is recorded.",
    "Les décisions d’archive et de nettoyage apparaîtront après l’enregistrement d’une action de cycle de vie.",
  ],
  [
    "Retention dates and archive obligations for this wedding.",
    "Dates de conservation et obligations d’archive pour ce mariage.",
  ],
  ["Project retention status", "Statut de conservation du mariage"],
  ["Notice status", "Statut de notification"],
  [
    "Record a lifecycle decision with an audit-friendly reason.",
    "Enregistrez une décision de cycle de vie avec une raison exploitable en audit.",
  ],
  [
    "Select the lifecycle update that should be recorded for the wedding file vault.",
    "Sélectionnez la mise à jour de cycle de vie à enregistrer pour le coffre-fort fichiers du mariage.",
  ],
  [
    "A file can become visible to couples, partners, or guests only after its visibility is changed. Keep sensitive records team-only until they are ready to share.",
    "Un fichier devient visible pour les couples, partenaires ou invités seulement après changement de visibilité. Gardez les dossiers sensibles réservés à l’équipe tant qu’ils ne sont pas prêts.",
  ],
  [
    "Show every file version for",
    "Afficher toutes les versions du fichier pour",
  ],
  ["Commercial controls", "Contrôles commerciaux"],
  ["No contract yet", "Aucun contrat pour le moment"],
  [
    "Manage service packages, event pricing, contract approval, manual payment records, and controlled access exceptions for",
    "Gérez les forfaits, tarifs événement, approbation de contrat, paiements manuels et exceptions d’accès contrôlées pour",
  ],
  [
    "The current commercial state that controls guest-list access, guest pages, and invitation sending.",
    "L’état commercial actuel qui contrôle l’accès à la liste d’invités, aux pages invités et aux envois d’invitations.",
  ],
  ["Guest page and invitations", "Page invité et invitations"],
  ["Expected project total", "Total prévu du mariage"],
  ["Event package selection", "Choix des forfaits événement"],
  [
    "Choose the service package and planned guest count that should shape the current price estimate.",
    "Choisissez le forfait et le nombre d’invités prévus qui doivent former l’estimation actuelle.",
  ],
  ["Package selection", "Choix du forfait"],
  ["Planned guests", "Invités prévus"],
  [
    "Current project pricing from selected event packages and approved adjustments.",
    "Tarification actuelle du mariage selon les forfaits événement et ajustements approuvés.",
  ],
  ["Save pricing calculation", "Enregistrer le calcul tarifaire"],
  [
    "Record only authorized price adjustments with a clear reason.",
    "Enregistrez uniquement les ajustements tarifaires autorisés avec une raison claire.",
  ],
  [
    "Confirm the project before changing commercial records.",
    "Confirmez le mariage avant de modifier les dossiers commerciaux.",
  ],
  ["Commercial access is role-protected", "Accès commercial protégé par rôle"],
  [
    "Package, contract, payment, exception, and revenue details are shown only when the current role has the matching server-side permission.",
    "Les détails de forfait, contrat, paiement, exception et revenus s’affichent seulement lorsque le rôle actuel dispose de la permission serveur correspondante.",
  ],
  [
    "Payment gate summary for guest-facing access.",
    "Résumé du seuil de paiement pour l’accès côté invité.",
  ],
  [
    "Save event package selections for",
    "Enregistrer les forfaits événement pour",
  ],
  [
    "Save the current price estimate for",
    "Enregistrer l’estimation actuelle pour",
  ],
  ["Apply a price adjustment for", "Appliquer un ajustement tarifaire pour"],
  ["Back to wedding", "Retour au mariage"],
  ["Event command center for", "Centre de pilotage de l’événement pour"],
  ["Prepare invitations", "Préparer les invitations"],
  [
    "Use it to move from event context into invitations, seating, check-in, files, and reporting without losing the current event.",
    "Utilisez-le pour passer du contexte de l’événement vers invitations, placement, accueil, fichiers et rapports sans perdre l’événement en cours.",
  ],
  [
    "Key facts teams need before entering an event workflow.",
    "Les informations clés dont les équipes ont besoin avant d’ouvrir un flux événement.",
  ],
  [
    "This page only shows work areas your role can open for this event. Project-level areas still respect wedding permissions.",
    "Cette page affiche seulement les espaces que votre rôle peut ouvrir pour cet événement. Les espaces du mariage respectent toujours les permissions du dossier.",
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
    "Move into the event-specific workspace you need next.",
    "Passez à l’espace propre à l’événement dont vous avez besoin maintenant.",
  ],
  [
    "Review event-level guest, RSVP, seating, check-in, and delivery signals.",
    "Revoyez les signaux événement sur invités, RSVP, placement, accueil et livraison.",
  ],
  [
    "Manage templates, field placement, previews, approval, and generated files.",
    "Gérez les modèles, champs placés, aperçus, approbation et fichiers générés.",
  ],
  [
    "Assign guests to tables, review capacity, and prepare table-card exports.",
    "Placez les invités à table, vérifiez la capacité et préparez les exports de cartons de table.",
  ],
  [
    "Run staff check-in, scan guest codes, search manually, and monitor arrivals.",
    "Pilotez l’accueil équipe, scannez les codes invités, recherchez manuellement et suivez les arrivées.",
  ],
  [
    "Manage event-specific files, secure downloads, and retention review.",
    "Gérez les fichiers de l’événement, téléchargements sécurisés et revue de conservation.",
  ],
  [
    "Template and generation work is available.",
    "Le travail de modèles et génération est disponible.",
  ],
  ["Table planning is available.", "La préparation des tables est disponible."],
  [
    "Arrival operations are available.",
    "Les opérations d’accueil sont disponibles.",
  ],
  ["Event files are available.", "Les fichiers événement sont disponibles."],
  [
    "Review RSVP, invitation, seating, and arrival signals for",
    "Revoyez les signaux RSVP, invitation, placement et arrivées pour",
  ],
  [
    "Use this page to decide where the event team should focus next.",
    "Utilisez cette page pour décider où l’équipe événement doit se concentrer maintenant.",
  ],
  [
    "The current event signal set and refresh evidence.",
    "Les signaux actuels de l’événement et la preuve d’actualisation.",
  ],
  [
    "This view combines only the event signals your role may read. Use the linked event workspace when you need to continue into an operational area.",
    "Cette vue regroupe seulement les signaux événement que votre rôle peut consulter. Utilisez l’espace événement lié pour continuer vers une zone opérationnelle.",
  ],
  [
    "Comparable event-level measures for quick operational review.",
    "Mesures comparables de l’événement pour une revue opérationnelle rapide.",
  ],
  [
    "RSVP, seating, and check-in counts should be reviewed together before event-day handoff.",
    "Les compteurs RSVP, placement et accueil doivent être revus ensemble avant le passage au jour J.",
  ],
  [
    "Reports remain available for exports when the team needs a CSV handoff or audit-friendly snapshot.",
    "Les rapports restent disponibles pour les exports lorsque l’équipe a besoin d’un CSV ou d’un instantané exploitable en audit.",
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
    "Generate a sample before approval.",
    "Générez un échantillon avant approbation.",
  ],
  [
    "Guest files linked to this design after generation.",
    "Fichiers invités liés à ce design après génération.",
  ],
  [
    "Register the Canva-exported PDF, place guest fields, approve the placement preview, then generate guest-ready invitation files for this event.",
    "Enregistrez le PDF exporté depuis Canva, placez les champs invités, approuvez l’aperçu de placement, puis générez les invitations prêtes pour cet événement.",
  ],
  ["Recommended next step", "Prochaine étape recommandée"],
  [
    "Use approved placement previews before generating guest PDFs.",
    "Utilisez les aperçus de placement approuvés avant de générer les PDF invités.",
  ],
  ["Register PDF design", "Enregistrer un design PDF"],
  [
    "Guest page links stay separate from check-in",
    "Les liens de page invitée restent séparés de l’accueil",
  ],
  ["Preview review", "Revue de l’aperçu"],
  ["Workflow", "Flux de travail"],
  ["Registered invitation designs", "Designs d’invitation enregistrés"],
  [
    "Open a design to place fields, review the placement preview, or generate invitation files for assigned guests.",
    "Ouvrez un design pour placer les champs, revoir l’aperçu ou générer les fichiers d’invitation des invités affectés.",
  ],
  ["Generate invitations", "Générer les invitations"],
  ["Open design", "Ouvrir le design"],
  [
    "Build the table plan for this event, assign active invited guests, and prepare the table-card CSV for print handoff.",
    "Préparez le plan de table de cet événement, placez les invités actifs attendus et préparez le CSV des cartons de table pour l’impression.",
  ],
  [
    "Active guests counted for this event.",
    "Invités actifs comptés pour cet événement.",
  ],
  ["Open seats", "Places libres"],
  ["Available across active tables.", "Disponibles sur les tables actives."],
  ["Over-capacity tables to review.", "Tables en surcapacité à revoir."],
  ["Generated table-card files.", "Fichiers de cartons de table générés."],
  ["Guest assignments", "Affectations des invités"],
  [
    "Compare capacity, status, and current guests before changing assignments.",
    "Comparez capacité, statut et invités actuels avant de changer les affectations.",
  ],
  [
    "The safest next step depends on both table capacity and guest assignment access.",
    "La prochaine action dépend à la fois de la capacité des tables et du droit d’affecter les invités.",
  ],
  ["Tables available", "Tables disponibles"],
  ["table ready for assignment.", "table prête pour affectation."],
  ["tables ready for assignment.", "tables prêtes pour affectation."],
  ["Guests waiting", "Invités en attente"],
  [
    "active guests still need a table.",
    "invités actifs ont encore besoin d’une table.",
  ],
  [
    "Your role can assign guests for this event.",
    "Votre rôle peut affecter des invités pour cet événement.",
  ],
  ["Can assign", "Peut affecter"],
  [
    "Event-day teams should review the map after table edits.",
    "Les équipes du jour J doivent revoir le plan après modification des tables.",
  ],
  ["Open map", "Ouvrir le plan"],
  ["Create one table", "Créer une table"],
  [
    "Use this for a named family, protocol, or service table.",
    "Utilisez ceci pour une table de famille, protocole ou service nommée.",
  ],
  ["Table details", "Détails de la table"],
  [
    "Notes stay with the table plan for staff review.",
    "Les notes restent avec le plan de table pour la revue équipe.",
  ],
  ["Create tables", "Créer les tables"],
  ["Create table", "Créer la table"],
  ["Create a table batch", "Créer un lot de tables"],
  [
    "Add a numbered table run when the room layout is already known.",
    "Ajoutez une série de tables numérotées lorsque la salle est déjà connue.",
  ],
  ["Batch details", "Détails du lot"],
  ["Start number", "Numéro de départ"],
  ["active seats assigned", "places actives attribuées"],
  ["Table controls", "Contrôles de table"],
  ["Table status", "Statut de la table"],
  ["Guest-facing description", "Description visible par les invités"],
  ["Save table", "Enregistrer la table"],
  ["No guests assigned", "Aucun invité affecté"],
  [
    "Assign guests from the guest assignment tab when this table is ready.",
    "Affectez les invités depuis l’onglet d’affectation lorsque cette table est prête.",
  ],
  ["Open now", "Ouvert maintenant"],
  ["Not open", "Pas encore ouvert"],
  ["Record arrivals for", "Enregistrez les arrivées pour"],
  [
    "resolve QR references, find guests by name or table, and keep offline stations aligned.",
    "résolvez les références QR, trouvez les invités par nom ou table et gardez les postes hors ligne alignés.",
  ],
  [
    "Expected guest units versus arrived units.",
    "Unités invitées attendues par rapport aux unités arrivées.",
  ],
  ["Guest units still expected.", "Unités invitées encore attendues."],
  ["Offline queue", "File hors ligne"],
  ["Unexpected guests", "Invités inattendus"],
  ["Requests waiting for review.", "Demandes en attente de revue."],
  ["Arrival dashboard", "Tableau des arrivées"],
  ["Event time is not set.", "L’heure de l’événement n’est pas définie."],
  ["Event time:", "Heure de l’événement :"],
  [
    "Total guest units expected for this event.",
    "Total des unités invitées attendues pour cet événement.",
  ],
  [
    "Guest groups with some arrivals still outstanding.",
    "Groupes invités avec des arrivées encore attendues.",
  ],
  [
    "Scan attempts that may need staff review.",
    "Tentatives de scan pouvant nécessiter une revue équipe.",
  ],
  [
    "Paste the scanned QR text to open the focused scan review page.",
    "Collez le texte QR scanné pour ouvrir la page de revue ciblée.",
  ],
  ["Invitation QR reference", "Référence QR d’invitation"],
  [
    "Find guest from the invitation QR code for",
    "Trouver l’invité depuis le QR d’invitation pour",
  ],
  [
    "Find guest from the scanned QR code for",
    "Trouver l’invité depuis le QR scanné pour",
  ],
  ["Find guest", "Trouver l’invité"],
  [
    "The public guest page token and check-in token stay separate.",
    "Le jeton de page invitée publique et le jeton d’accueil restent séparés.",
  ],
  ["Open scan page", "Ouvrir la page de scan"],
  ["Search guests", "Rechercher des invités"],
  [
    "Filter by name, phone, invitation reference, side, or table.",
    "Filtrez par nom, téléphone, référence d’invitation, côté ou table.",
  ],
  ["Search filters", "Filtres de recherche"],
  ["Search invited guests for", "Rechercher les invités attendus pour"],
  ["Guest arrival list", "Liste des arrivées invitées"],
  ["Showing the first", "Affichage des"],
  ["matching invited guests.", "premiers invités attendus correspondants."],
  ["Both families", "Deux familles"],
  ["Awaiting reply", "Réponse en attente"],
  ["Unassigned", "Non affecté"],
  [
    "Guest has no active table assignment.",
    "L’invité n’a pas de table active affectée.",
  ],
  ["Check in", "Enregistrer l’arrivée de"],
  ["Save T", "Enregistrer T"],
  ["Register invitation design for", "Enregistrer le design d’invitation pour"],
  ["for Reception event", "pour Événement réception"],
  [
    "Guest is already fully checked in; new scans are duplicates.",
    "L’invité est déjà entièrement accueilli ; les nouveaux scans sont des doublons.",
  ],
  [
    "Review templates, generated invitations, seating exports, check-in reports, and other records the team needs for",
    "Revoyez les modèles, invitations générées, exports de placement, rapports d’accueil et autres dossiers nécessaires à l’équipe pour",
  ],
  ["Project file vault", "Coffre-fort du mariage"],
  ["File snapshot", "Instantané des fichiers"],
  [
    "The event-specific file state for this workspace.",
    "L’état des fichiers propres à cet événement.",
  ],
  ["Guest visible", "Visible invité"],
  [
    "File access is event-scoped",
    "L’accès aux fichiers est limité à l’événement",
  ],
  [
    "This page only lists files connected to this event. File details, downloads, versions, and retention controls still follow the project file permissions.",
    "Cette page liste seulement les fichiers liés à cet événement. Les détails, téléchargements, versions et contrôles de conservation suivent toujours les permissions fichiers du mariage.",
  ],
  ["Event records", "Dossiers événement"],
  [
    "Open a file record to review versions, download permissions, access history, or archive state.",
    "Ouvrez un dossier fichier pour revoir versions, droits de téléchargement, historique d’accès ou état d’archive.",
  ],
  ["No event files yet", "Aucun fichier événement pour le moment"],
  [
    "Files assigned to this event will appear here after they are registered from the project file vault.",
    "Les fichiers affectés à cet événement apparaîtront ici après leur enregistrement depuis le coffre-fort du mariage.",
  ],
  ["Event context", "Contexte événement"],
  [
    "Details that help confirm each file belongs to the right event.",
    "Détails qui aident à confirmer que chaque fichier appartient au bon événement.",
  ],
  [
    "Invitation files will appear here when the couple or Diginoces makes them available.",
    "Les fichiers d’invitation apparaîtront ici lorsque le couple ou Diginoces les rend disponibles.",
  ],
  ["Invitation files", "Fichiers d’invitation"],
  ["Seating exports", "Exports de placement"],
  ["Check-in records", "Dossiers d’accueil"],
  [
    "Use the project vault to add files",
    "Utilisez le coffre-fort du mariage pour ajouter des fichiers",
  ],
  [
    "Event files are registered and versioned from the project file vault. This event page keeps the linked records easy to review.",
    "Les fichiers événement sont enregistrés et versionnés depuis le coffre-fort du mariage. Cette page garde les dossiers liés faciles à revoir.",
  ],
  ["Keep visibility deliberate", "Gardez la visibilité intentionnelle"],
  [
    "Guest-visible and partner-visible files should be reviewed before handoff. Sensitive records should remain team-only.",
    "Les fichiers visibles par invités ou partenaires doivent être revus avant transmission. Les dossiers sensibles doivent rester réservés à l’équipe.",
  ],
  [
    "Review table placement and occupancy before event-day handoff. Use the seating plan to edit tables and guest assignments.",
    "Revoyez placement et occupation avant le passage au jour J. Utilisez le plan de table pour modifier tables et affectations invités.",
  ],
  [
    "Guests counted across active tables.",
    "Invités comptés sur les tables actives.",
  ],
  [
    "Position markers in this event layout.",
    "Repères de position dans ce plan d’événement.",
  ],
  [
    "Tables that need seating review.",
    "Tables qui nécessitent une revue de placement.",
  ],
  ["Map is a placement review", "Le plan sert à la revue du placement"],
  [
    "Table markers help staff verify the room view. The seating plan remains the place to change tables, capacity, guests, and exports.",
    "Les repères de table aident l’équipe à vérifier la salle. Le plan de table reste l’endroit où modifier tables, capacité, invités et exports.",
  ],
  [
    "Use this list to scan the same table states without relying on marker position.",
    "Utilisez cette liste pour parcourir les mêmes états de table sans dépendre de la position des repères.",
  ],
  ["Register PDF", "Enregistrer le PDF"],
  [
    "Add the Canva-exported PDF that will receive guest names, event details, and public guest page QR or link fields before invitation files are generated.",
    "Ajoutez le PDF exporté depuis Canva qui recevra les noms invités, détails événement et champs QR ou lien de page invitée avant génération des invitations.",
  ],
  [
    "The next screen opens the field placement workspace.",
    "L’écran suivant ouvre l’espace de placement des champs.",
  ],
  [
    "Confirm the PDF is the final event design before registering it.",
    "Confirmez que le PDF est le design final de l’événement avant de l’enregistrer.",
  ],
  [
    "Place dynamic fields for names, event details, and guest links.",
    "Placez les champs dynamiques pour noms, détails événement et liens invités.",
  ],
  [
    "Public guest page QR fields stay separate from future check-in tokens.",
    "Les champs QR de page invitée publique restent séparés des futurs jetons d’accueil.",
  ],
  [
    "Register the exported PDF for this event. Keep editable Canva source files in your normal design handoff location.",
    "Enregistrez le PDF exporté pour cet événement. Gardez les sources Canva éditables dans votre emplacement habituel de transmission design.",
  ],
  ["Design details", "Détails du design"],
  [
    "Use a name that matches the event and design version your team expects to review.",
    "Utilisez un nom correspondant à l’événement et à la version de design que l’équipe doit revoir.",
  ],
  [
    "PDF files are checked again when the form is submitted. Other formats are rejected.",
    "Les fichiers PDF sont revérifiés à l’envoi du formulaire. Les autres formats sont refusés.",
  ],
  [
    "A compact read of the project areas your role can access.",
    "Une lecture compacte des espaces du mariage accessibles à votre rôle.",
  ],
  [
    "Active guests, sides, printed-only guests, and list size.",
    "Invités actifs, côtés, invités imprimés uniquement et taille de la liste.",
  ],
  [
    "Response status and any RSVP rows needing review.",
    "Statut des réponses et lignes RSVP à revoir.",
  ],
  [
    "Generated invitations and invitation file status.",
    "Invitations générées et statut des fichiers d’invitation.",
  ],
  [
    "Guest import sessions and review status.",
    "Sessions d’import invités et statut de revue.",
  ],
  [
    "Prepared messages and manual sending status.",
    "Messages préparés et statut d’envoi manuel.",
  ],
  [
    "Arrivals, duplicate scans, and unexpected guest requests.",
    "Arrivées, scans doublons et demandes d’invités inattendus.",
  ],
  [
    "Contracts, confirmed payments, and guest-page access.",
    "Contrats, paiements confirmés et accès à la page invitée.",
  ],
  [
    "Open an event dashboard to review arrivals, seating, messages, files, and RSVP activity for that event.",
    "Ouvrez un tableau événement pour revoir arrivées, placement, messages, fichiers et activité RSVP de cet événement.",
  ],
  [
    "A simple read of the active guest list, sides, and printed invitations.",
    "Une lecture simple de la liste d’invités actifs, des côtés et des invitations imprimées.",
  ],
  [
    "Current response counts across the events visible to this couple view.",
    "Compteurs de réponses actuels sur les événements visibles dans cette vue couple.",
  ],
  [
    "This page is intentionally narrower than the staff dashboard. It keeps the couple focused on guest and RSVP progress while staff-only operations remain in the project workspace.",
    "Cette page est volontairement plus simple que le tableau équipe. Elle garde le couple concentré sur les invités et les RSVP pendant que les opérations internes restent dans l’espace projet.",
  ],
  [
    "Keep Diginoces, assigned partners, and internal reviewers aligned in one project-scoped thread. Choose the audience before posting.",
    "Gardez Diginoces, partenaires assignés et réviseurs internes alignés dans un fil lié au mariage. Choisissez l’audience avant de publier.",
  ],
  [
    "Use the thread for decisions, handoffs, partner questions, or context that should stay with this wedding.",
    "Utilisez le fil pour les décisions, transmissions, questions partenaires ou contexte qui doit rester avec ce mariage.",
  ],
  [
    "Keep private commercial details out of partner-visible comments.",
    "Évitez les détails commerciaux privés dans les commentaires visibles par les partenaires.",
  ],
  [
    "Shared project updates and team-only notes, newest first.",
    "Mises à jour partagées et notes internes, les plus récentes d’abord.",
  ],
  [
    "Project update ready for review.",
    "Mise à jour du projet prête pour revue.",
  ],
  [
    "Confirm the wedding before adding an update.",
    "Confirmez le mariage avant d’ajouter une mise à jour.",
  ],
  [
    "Choose the audience before posting.",
    "Choisissez l’audience avant de publier.",
  ],
  [
    "Use for partner questions, external handoffs, or updates that assigned partner users may need.",
    "Utilisez ceci pour les questions partenaires, transmissions externes ou mises à jour utiles aux partenaires assignés.",
  ],
  [
    "Use for internal preparation notes. This option appears only for roles with team-note access.",
    "Utilisez ceci pour les notes de préparation internes. Cette option apparaît seulement pour les rôles ayant accès aux notes équipe.",
  ],
  [
    "Current comment visibility for this wedding.",
    "Visibilité actuelle des commentaires pour ce mariage.",
  ],
  [
    "Capture private couple feedback, keep testimonial permission explicit, and decide what can be reused outside the project.",
    "Capturez les retours privés du couple, gardez l’autorisation de témoignage explicite et décidez ce qui peut être réutilisé hors du projet.",
  ],
  [
    "Private feedback stays internal. Public testimonial use requires couple permission and a reviewer decision.",
    "Les retours privés restent internes. Toute utilisation publique de témoignage nécessite l’accord du couple et une décision de revue.",
  ],
  [
    "Couple feedback will appear here after a post-event response is submitted.",
    "Les retours du couple apparaîtront ici après l’envoi d’une réponse post-événement.",
  ],
  [
    "Most recent private feedback for this wedding.",
    "Retour privé le plus récent pour ce mariage.",
  ],
  [
    "Keep the post-event record useful and private by default.",
    "Gardez le dossier post-événement utile et privé par défaut.",
  ],
  [
    "Approved testimonials can support future public use, but this page does not publish them automatically.",
    "Les témoignages approuvés peuvent soutenir une future utilisation publique, mais cette page ne les publie pas automatiquement.",
  ],
  [
    "Review guest wishes, protect the final keepsake from unsuitable text, and prepare approved messages for the design workflow.",
    "Relisez les vœux des invités, protégez le souvenir final des textes inadaptés et préparez les messages approuvés pour le design.",
  ],
  [
    "The current guest-book workload and export readiness.",
    "Charge de revue du livre d’or et préparation des exports.",
  ],
  [
    "Start with messages that still need a moderation decision before the couple or design team sees them.",
    "Commencez par les messages qui attendent encore une décision de modération avant vue couple ou design.",
  ],
  [
    "Flagged or excluded messages remain visible for audit, but stay out of the export.",
    "Les messages signalés ou exclus restent visibles pour audit, mais hors export.",
  ],
  [
    "Create the CSV only after the review queue is ready for the final guest-book layout.",
    "Créez le CSV seulement lorsque la file de revue est prête pour la mise en page finale du livre d’or.",
  ],
  [
    "Review each guest note before it is included in the final guest-book export.",
    "Relisez chaque note invitée avant son inclusion dans l’export final du livre d’or.",
  ],
  [
    "A quick read of the newest guest-book submission.",
    "Lecture rapide de la dernière contribution au livre d’or.",
  ],
  [
    "Excluded and flagged messages stay visible for review but are kept out of keepsake exports.",
    "Les messages exclus ou signalés restent visibles pour revue, mais hors exports souvenir.",
  ],
  [
    "Prepare a CSV once the review queue is ready for design work.",
    "Préparez un CSV lorsque la file de revue est prête pour le design.",
  ],
  [
    "Track CSV files used to assemble the final keepsake design.",
    "Suivez les CSV utilisés pour assembler le design souvenir final.",
  ],
  [
    "Approved guest-book messages can be packaged into a CSV for the keepsake design workflow.",
    "Les messages approuvés du livre d’or peuvent être groupés en CSV pour le flux design souvenir.",
  ],
  [
    "Approve the messages that belong in the final keepsake, then prepare the CSV export.",
    "Approuvez les messages à intégrer au souvenir final, puis préparez l’export CSV.",
  ],
  [
    "Approve the guest wishes that should become part of the final keepsake, or send a clear note back to the team when something needs correction.",
    "Approuvez les vœux invités à intégrer au souvenir final, ou renvoyez une note claire à l’équipe lorsqu’une correction est nécessaire.",
  ],
  [
    "Each message has already passed team moderation. This step confirms what the couple wants in the keepsake.",
    "Chaque message a déjà passé la modération équipe. Cette étape confirme ce que le couple veut garder dans le souvenir.",
  ],
  [
    "Every message here has already passed team moderation and is waiting for the couple decision.",
    "Chaque message ici a déjà passé la modération équipe et attend la décision du couple.",
  ],
  [
    "Diginoces will send moderated guest messages here before the final guest-book file is prepared.",
    "Diginoces enverra ici les messages invités modérés avant préparation du fichier final du livre d’or.",
  ],
  [
    "The first message currently waiting in the queue.",
    "Le premier message actuellement en attente dans la file.",
  ],
  [
    "Messages approved by the team will appear here for the couple decision.",
    "Les messages approuvés par l’équipe apparaîtront ici pour décision du couple.",
  ],
  [
    "Approved messages can move into the final guest-book export. Correction requests return to the team before export.",
    "Les messages approuvés peuvent passer dans l’export final du livre d’or. Les demandes de correction retournent à l’équipe avant export.",
  ],
  [
    "Keep the review quick and consistent.",
    "Gardez une revue rapide et cohérente.",
  ],
  [
    "Approve messages that are ready to preserve as written. Request correction when a name, wording, or tone needs adjustment.",
    "Approuvez les messages prêts à être conservés tels quels. Demandez une correction lorsqu’un nom, un texte ou un ton doit être ajusté.",
  ],
  [
    "Exclude a message only when it should not appear in the final keepsake at all.",
    "Excluez un message seulement s’il ne doit pas apparaître du tout dans le souvenir final.",
  ],
  [
    "Keep French and English WhatsApp wording ready for invitations, RSVP requests, reminders, follow-ups, and event updates. This page prepares text only; sending remains a guided manual workflow.",
    "Gardez les textes WhatsApp français et anglais prêts pour invitations, demandes RSVP, rappels, relances et mises à jour événement. Cette page prépare le texte seulement ; l’envoi reste manuel guidé.",
  ],
  [
    "Review reusable wording by purpose, language, version, and status before preparing messages.",
    "Revoyez les textes réutilisables par objectif, langue, version et statut avant de préparer les messages.",
  ],
  [
    "First invitation wording for guests.",
    "Premier texte d’invitation pour les invités.",
  ],
  [
    "One-off wording for a controlled manual message.",
    "Texte ponctuel pour un message manuel contrôlé.",
  ],
  [
    "Saved wording preview is hidden for this sample workspace record.",
    "L’aperçu du texte enregistré est masqué pour cet exemple d’espace.",
  ],
  [
    "Templates should cover the languages used by guests for this wedding.",
    "Les modèles doivent couvrir les langues utilisées par les invités de ce mariage.",
  ],
  [
    "Ready for French guest messages",
    "Prêt pour les messages invités en français",
  ],
  [
    "Ready for English guest messages",
    "Prêt pour les messages invités en anglais",
  ],
  [
    "Available for queue preparation",
    "Disponible pour la préparation de la file",
  ],
  [
    "Templates prepare the text used by the message queue. This page does not send WhatsApp messages automatically.",
    "Les modèles préparent les textes utilisés par la file de messages. Cette page n’envoie pas automatiquement de messages WhatsApp.",
  ],
  ["Create wording", "Créer un texte"],
  [
    "Add reusable wording for a message type and language. Keep variables intact so Diginoces can insert the right guest, event, and invitation link.",
    "Ajoutez un texte réutilisable pour un type de message et une langue. Gardez les variables intactes afin que Diginoces insère le bon invité, événement et lien d’invitation.",
  ],
  [
    "Choose the workflow where this wording will be used.",
    "Choisissez le flux dans lequel ce texte sera utilisé.",
  ],
  [
    "Use a name your operations team will recognize.",
    "Utilisez un nom reconnu par votre équipe opérations.",
  ],
  ["Message body", "Corps du message"],
  [
    "Supported variables include guest, event, and public invitation link fields.",
    "Les variables prises en charge incluent invité, événement et lien public d’invitation.",
  ],
  [
    "Choose the guest, event, invitation context, and message type. Diginoces prepares the wording; your team still reviews and sends it manually.",
    "Choisissez l’invité, l’événement, le contexte d’invitation et le type de message. Diginoces prépare le texte ; votre équipe le relit et l’envoie toujours manuellement.",
  ],
  ["Message overview", "Vue des messages"],
  [
    "The prepared message can include the guest name, event details, invitation reference, and public guest page link.",
    "Le message préparé peut inclure le nom invité, les détails événement, la référence d’invitation et le lien de page invitée publique.",
  ],
  [
    "Select the target and message type before Diginoces creates the final wording.",
    "Sélectionnez la cible et le type de message avant que Diginoces crée le texte final.",
  ],
  [
    "Choose the reason this guest is being contacted.",
    "Choisissez la raison du contact avec cet invité.",
  ],
  [
    "Event details can be inserted into the prepared text.",
    "Les détails événement peuvent être insérés dans le texte préparé.",
  ],
  [
    "The guest profile provides name and WhatsApp context.",
    "La fiche invité fournit le nom et le contexte WhatsApp.",
  ],
  [
    "Attach generated invitation context when relevant.",
    "Joignez le contexte d’invitation générée lorsque c’est pertinent.",
  ],
  [
    "Include only the guest-specific link prepared for this recipient.",
    "Incluez seulement le lien propre à cet invité.",
  ],
  [
    "Useful for updates, reminders, and modified event details.",
    "Utile pour les mises à jour, rappels et détails événement modifiés.",
  ],
  [
    "After preparation, the message opens on its detail page for review and manual sending.",
    "Après préparation, le message s’ouvre sur sa page détail pour revue et envoi manuel.",
  ],
  [
    "Sending stays controlled: prepare here, send manually from the message detail page, then record the outcome.",
    "L’envoi reste contrôlé : préparez ici, envoyez manuellement depuis la page détail, puis enregistrez le résultat.",
  ],
  [
    "These messages are waiting for manual sending or follow-up.",
    "Ces messages attendent un envoi manuel ou une relance.",
  ],
  [
    "Open any prepared message to review the text and record the final manual sending result.",
    "Ouvrez un message préparé pour relire le texte et enregistrer le résultat final de l’envoi manuel.",
  ],
  [
    "Create one guest or household with the invitation name, side, contact route, event assignments, and private team notes the operations team needs.",
    "Créez un invité ou foyer avec le nom d’invitation, le côté, le contact, les affectations événement et les notes privées utiles aux opérations.",
  ],
  [
    "Use the name that should appear across invitations, lists, and event-day operations.",
    "Utilisez le nom qui doit apparaître sur invitations, listes et opérations du jour J.",
  ],
  [
    "The guest-facing name for invitations and RSVP.",
    "Le nom visible par l’invité sur invitations et RSVP.",
  ],
  [
    "Sets the expected guest count for this entry.",
    "Définit le nombre d’invités attendu pour cette entrée.",
  ],
  [
    "Controls side ownership, filters, and permissions.",
    "Contrôle le côté, les filtres et les permissions.",
  ],
  [
    "Decide whether this guest can receive digital follow-up or should stay on the printed invitation path.",
    "Décidez si cet invité peut recevoir un suivi numérique ou doit rester sur le parcours d’invitation imprimée.",
  ],
  [
    "Required for digital invitation and message preparation unless the guest is printed-only.",
    "Obligatoire pour invitation numérique et préparation de message sauf si l’invité est imprimé uniquement.",
  ],
  [
    "Keeps guest-facing labels consistent in English or French.",
    "Garde les libellés invités cohérents en anglais ou en français.",
  ],
  [
    "Use this when the guest does not need WhatsApp-based invitation or reminder preparation.",
    "Utilisez ceci lorsque l’invité n’a pas besoin de préparation d’invitation ou rappel via WhatsApp.",
  ],
  [
    "Assign the guest to event lists and internal categories so teams can prepare the right invitations and follow-ups.",
    "Affectez l’invité aux listes événement et catégories internes afin que les équipes préparent les bonnes invitations et relances.",
  ],
  [
    "Select every event this guest should be invited to.",
    "Sélectionnez chaque événement auquel cet invité doit être convié.",
  ],
  [
    "Use tags for family groups, VIP handling, protocol, or follow-up lists.",
    "Utilisez les tags pour familles, VIP, protocole ou listes de suivi.",
  ],
  [
    "Visible to authorized team members only. Keep it factual and useful for operations.",
    "Visible seulement par les membres autorisés. Gardez-le factuel et utile pour les opérations.",
  ],
  [
    "The guest will be checked against validation and permission rules before it is saved.",
    "L’invité sera vérifié selon les règles de validation et permission avant enregistrement.",
  ],
  ["Create guest", "Créer l’invité"],
  [
    "These checks help keep invitations and event-day lists clean.",
    "Ces contrôles gardent les invitations et listes du jour J propres.",
  ],
  ["Use the invitation name", "Utilisez le nom d’invitation"],
  [
    "Enter the person or household name exactly as the guest should see it.",
    "Saisissez le nom de la personne ou du foyer exactement comme l’invité doit le voir.",
  ],
  ["Confirm WhatsApp readiness", "Confirmer la préparation WhatsApp"],
  [
    "Digital guests need a usable WhatsApp number; printed-only guests do not.",
    "Les invités numériques ont besoin d’un numéro WhatsApp utilisable ; les invités imprimés uniquement non.",
  ],
  [
    "Current project options loaded for this form.",
    "Options actuelles du mariage chargées pour ce formulaire.",
  ],
  [
    "Only authorized project users can create guests, and side ownership is checked again when the form is submitted.",
    "Seuls les utilisateurs projet autorisés peuvent créer des invités, et le côté est revérifié à l’envoi du formulaire.",
  ],
  [
    "Keep this profile accurate for invitations, RSVP tracking, event assignments, and event-day operations.",
    "Gardez cette fiche exacte pour invitations, suivi RSVP, affectations événement et opérations du jour J.",
  ],
  [
    "Update the guest-facing name, guest count type, and side ownership.",
    "Mettez à jour le nom visible par l’invité, le type de comptage et le côté.",
  ],
  [
    "The name shown on invitations, RSVP, and lists.",
    "Le nom affiché sur invitations, RSVP et listes.",
  ],
  [
    "Sets the expected guest count for this profile.",
    "Définit le nombre d’invités attendu pour cette fiche.",
  ],
  [
    "Changing side ownership is permission-checked on save.",
    "Le changement de côté est vérifié par permission à l’enregistrement.",
  ],
  [
    "Manage digital readiness, language, and whether this guest remains active in the project.",
    "Gérez la préparation numérique, la langue et le statut actif de cet invité dans le mariage.",
  ],
  [
    "Excludes this guest from WhatsApp-required invitation preparation.",
    "Exclut cet invité des préparations d’invitation nécessitant WhatsApp.",
  ],
  [
    "Turning this off removes the guest from active operating lists and requires deactivation permission.",
    "Désactiver ceci retire l’invité des listes opérationnelles actives et nécessite la permission de désactivation.",
  ],
  [
    "Keep event assignments, internal tags, and team notes aligned with current plans.",
    "Gardez affectations événement, tags internes et notes équipe alignés avec les plans actuels.",
  ],
  [
    "Updates are checked against side ownership, project access, and deactivation rules before saving.",
    "Les mises à jour sont vérifiées selon le côté, l’accès projet et les règles de désactivation avant enregistrement.",
  ],
  ["Save changes for", "Enregistrer les modifications pour"],
  [
    "Current operating status for this guest.",
    "Statut opérationnel actuel de cet invité.",
  ],
  [
    "Side changes and deactivation are permission-checked on the server. If you turn off active status without permission, the update will be rejected.",
    "Les changements de côté et désactivations sont vérifiés côté serveur. Si vous désactivez le statut actif sans permission, la mise à jour sera rejetée.",
  ],
  [
    "Keep this guest ready for the next invitation or event-day action.",
    "Gardez cet invité prêt pour la prochaine invitation ou action du jour J.",
  ],
  [
    "Private notes should help team members act, not store sensitive details unnecessarily.",
    "Les notes privées doivent aider l’équipe à agir, sans stocker inutilement des détails sensibles.",
  ],
  [
    "Event assignments drive invitation generation, RSVP views, and day-of operations.",
    "Les affectations événement pilotent génération d’invitations, vues RSVP et opérations du jour J.",
  ],
  [
    "A digital guest needs a usable WhatsApp number before message preparation.",
    "Un invité numérique a besoin d’un numéro WhatsApp utilisable avant préparation des messages.",
  ],
  [
    "This preview is available only to authorized users.",
    "Cet aperçu est disponible seulement pour les utilisateurs autorisés.",
  ],
  [
    "A quick check before the team starts manual sending work.",
    "Une vérification rapide avant que l’équipe commence les envois manuels.",
  ],
  [
    "Request a correction when wording, names, or tone need a careful adjustment before export.",
    "Demandez une correction quand le texte, les noms ou le ton nécessitent un ajustement avant l’export.",
  ],
  [
    "Partner-visible updates may be seen by authorized partner users. Team-only updates stay internal.",
    "Les mises à jour visibles par les partenaires peuvent être vues par les partenaires autorisés. Les mises à jour équipe restent internes.",
  ],
  [
    "Private feedback helps improve operations and is not public testimonial copy.",
    "Les retours privés aident à améliorer les opérations et ne sont pas des témoignages publics.",
  ],
  [
    "Internal commercial reports and activity history exports only appear for roles with the matching reporting and audit permissions.",
    "Les rapports commerciaux internes et exports d’historique apparaissent seulement pour les rôles disposant des permissions de rapport et d’audit correspondantes.",
  ],
  [
    "Guest count, family side, delivery type, and event assignment summary.",
    "Résumé du nombre d’invités, du côté familial, du type de remise et des affectations événement.",
  ],
  [
    "RSVP attendance summary across the wedding project's events.",
    "Résumé de présence RSVP sur les événements du mariage.",
  ],
  [
    "Table capacity, assigned guests, and remaining seating summary.",
    "Résumé de capacité des tables, invités placés et places restantes.",
  ],
  [
    "Expected guests, arrivals, duplicate scans, and unexpected guest requests.",
    "Résumé des invités attendus, arrivées, scans en doublon et demandes d’invités imprévus.",
  ],
  [
    "Contract, balance, payment gate, and exception summary for authorized teams.",
    "Résumé contrat, solde, seuil de paiement et exceptions pour les équipes autorisées.",
  ],
  [
    "Redacted team activity export for authorized operational review.",
    "Export expurgé de l’activité équipe pour revue opérationnelle autorisée.",
  ],
  [
    "Recent report exports stay visible for audit-friendly handoff and row-count review.",
    "Les exports récents restent visibles pour une transmission compatible audit et une vérification du nombre de lignes.",
  ],
  [
    "Manage trusted partner profiles, review partner-submitted wedding work, and keep Diginoces in control of final client access.",
    "Gérez les profils partenaires de confiance, revoyez le travail mariage soumis par les partenaires et gardez Diginoces maître de l’accès client final.",
  ],
  [
    "Partners ready for assigned or submitted work.",
    "Partenaires prêts pour le travail assigné ou soumis.",
  ],
  [
    "Profiles waiting for profile or access decisions.",
    "Profils en attente de décisions de profil ou d’accès.",
  ],
  [
    "Add the organization first. Account access and project work stay controlled separately.",
    "Ajoutez d’abord l’organisation. L’accès compte et le travail mariage restent contrôlés séparément.",
  ],
  [
    "Open a partner profile to review contacts, assigned work, linked accounts, and submission history.",
    "Ouvrez un profil partenaire pour revoir contacts, travail assigné, comptes liés et historique des soumissions.",
  ],
  [
    "Partner profiles can prepare or receive work, but final project access, review decisions, and client-facing controls stay permission gated.",
    "Les profils partenaires peuvent préparer ou recevoir du travail, mais l’accès final au mariage, les décisions de revue et les contrôles côté client restent limités par permission.",
  ],
  [
    "Review access, project submissions, and source records tied to this partner profile.",
    "Revoyez l’accès, les soumissions de mariages et les dossiers source liés à ce profil partenaire.",
  ],
  [
    "Manage profile status and linked accounts. These changes affect whether the partner can prepare or submit wedding work.",
    "Gérez le statut du profil et les comptes liés. Ces changements déterminent si le partenaire peut préparer ou soumettre du travail mariage.",
  ],
  [
    "Active partners can continue assigned work according to their permissions.",
    "Les partenaires actifs peuvent continuer le travail assigné selon leurs permissions.",
  ],
  [
    "Use the account identifier approved for this partner.",
    "Utilisez l’identifiant de compte approuvé pour ce partenaire.",
  ],
  [
    "Accounts that can access this partner profile and their operational role.",
    "Comptes pouvant accéder à ce profil partenaire et leur rôle opérationnel.",
  ],
  [
    "Drafts and submitted weddings created by this partner before they become active client work.",
    "Brouillons et mariages soumis par ce partenaire avant leur activation comme travail client.",
  ],
  [
    "Drafts and submitted weddings will appear here when this partner starts a request.",
    "Les brouillons et mariages soumis apparaîtront ici quand ce partenaire démarrera une demande.",
  ],
  [
    "Shows whether work was created by this partner or assigned by Diginoces.",
    "Indique si le travail a été créé par ce partenaire ou assigné par Diginoces.",
  ],
  [
    "Project source records appear after a partner-created or partner-assigned wedding is connected here.",
    "Les dossiers source du mariage apparaissent après liaison d’un mariage créé ou assigné par partenaire.",
  ],
  [
    "Partner-originated and partner-assigned work remain under Diginoces review and permission controls.",
    "Le travail créé ou assigné par partenaire reste sous revue Diginoces et contrôles de permission.",
  ],
  [
    "Choose the partner profile you want to work from before opening assigned weddings or preparing a new submission.",
    "Choisissez le profil partenaire depuis lequel travailler avant d’ouvrir les mariages assignés ou de préparer une nouvelle soumission.",
  ],
  [
    "Each profile keeps its wedding work, drafts, and review state separated.",
    "Chaque profil sépare son travail mariage, ses brouillons et son état de revue.",
  ],
  [
    "Review partner-submitted wedding projects before they become active client work under Diginoces controls.",
    "Revoyez les mariages soumis par les partenaires avant leur activation comme travail client sous contrôle Diginoces.",
  ],
  [
    "Use requested changes when the partner should correct details first.",
    "Utilisez les changements demandés lorsque le partenaire doit d’abord corriger les détails.",
  ],
  [
    "Partner project submissions that need a team decision will appear here.",
    "Les soumissions de mariages partenaires qui nécessitent une décision équipe apparaîtront ici.",
  ],
  [
    "Where to go when the file needs more work.",
    "Où aller lorsque le fichier demande encore du travail.",
  ],
  [
    "Markers show the current room view, with a readable list layout on smaller screens.",
    "Les marqueurs montrent la vue actuelle de la salle, avec une liste lisible sur les petits écrans.",
  ],
  [
    "Name the design so the team can recognize it later, then attach a PDF export no larger than 20 MB.",
    "Nommez le design pour que l’équipe le reconnaisse plus tard, puis joignez un export PDF de 20 Mo maximum.",
  ],
  [
    "Private notes and testimonial permissions will appear after the couple responds.",
    "Les notes privées et permissions de témoignage apparaîtront après la réponse du couple.",
  ],
  ["A quick read of the latest rating.", "Lecture rapide de la dernière note."],
  [
    "Resolve an invitation QR reference, confirm the matched guest, and record the arrival for",
    "Résolvez une référence QR d’invitation, confirmez l’invité trouvé et enregistrez l’arrivée pour",
  ],
  ["QR lookup is available.", "La recherche QR est disponible."],
  [
    "Confirm identity before recording arrival.",
    "Confirmez l’identité avant d’enregistrer l’arrivée.",
  ],
  [
    "Arrival count remains bounded by the guest record.",
    "Le nombre d’arrivées reste limité par la fiche invité.",
  ],
  [
    "Enter the text from the invitation QR code before confirming the arrival.",
    "Saisissez le texte du QR d’invitation avant de confirmer l’arrivée.",
  ],
  ["Paste or scan the QR reference", "Coller ou scanner la référence QR"],
  [
    "This looks up the guest and keeps the arrival action on this page.",
    "Cela recherche l’invité et garde l’action d’arrivée sur cette page.",
  ],
  [
    "Confirm the guest details before recording the arrival.",
    "Confirmez les détails de l’invité avant d’enregistrer l’arrivée.",
  ],
  [
    "The matched guest and arrival controls will appear here after a QR reference is resolved.",
    "L’invité trouvé et les contrôles d’arrivée apparaîtront ici après résolution d’une référence QR.",
  ],
  [
    "Review the exact WhatsApp text for",
    "Revoyez le texte WhatsApp exact pour",
  ],
  [
    "open WhatsApp only when ready, then record the result so the team can follow up confidently.",
    "ouvrez WhatsApp seulement quand c’est prêt, puis enregistrez le résultat pour un suivi fiable.",
  ],
  [
    "Confirm the recipient, wording version, and final text before any manual send.",
    "Confirmez le destinataire, la version du texte et le message final avant tout envoi manuel.",
  ],
  [
    "Current send state for this guest message.",
    "État d’envoi actuel pour ce message invité.",
  ],
  [
    "Opening WhatsApp does not mark the message as sent. Record the final outcome after the team completes the manual step.",
    "Ouvrir WhatsApp ne marque pas le message comme envoyé. Enregistrez le résultat final après l’étape manuelle.",
  ],
  [
    "Open WhatsApp when a link is available, then mark the result so operations can follow up accurately.",
    "Ouvrez WhatsApp quand un lien est disponible, puis marquez le résultat pour un suivi opérationnel exact.",
  ],
  [
    "Use when the message could not be sent.",
    "Utilisez ceci lorsque le message n’a pas pu être envoyé.",
  ],
  [
    "Use when the team intentionally does not send.",
    "Utilisez ceci lorsque l’équipe choisit volontairement de ne pas envoyer.",
  ],
  [
    "Leave one written note for the couple.",
    "Laissez une note écrite pour le couple.",
  ],
  [
    "Control this protected file record: review access, download when allowed, register a new version, or archive it with a clear reason.",
    "Contrôlez ce fichier protégé : revoyez l’accès, téléchargez si autorisé, enregistrez une nouvelle version ou archivez avec une raison claire.",
  ],
  [
    "Metadata, visibility, and retention state for this file record.",
    "Métadonnées, visibilité et état de conservation de ce fichier.",
  ],
  [
    "Versions, access checks, and archive events for this record.",
    "Versions, contrôles d’accès et événements d’archivage pour ce dossier.",
  ],
  [
    "Confirm the wedding before changing the record.",
    "Confirmez le mariage avant de modifier le dossier.",
  ],
  [
    "Keep earlier versions available while registering the latest file details.",
    "Gardez les versions précédentes disponibles pendant l’enregistrement du dernier fichier.",
  ],
  [
    "Choose the updated file when it is ready, or enter the new details below.",
    "Choisissez le fichier mis à jour quand il est prêt, ou saisissez les nouveaux détails ci-dessous.",
  ],
  [
    "Optional context for why this version is being added.",
    "Contexte facultatif expliquant pourquoi cette version est ajoutée.",
  ],
  [
    "Archive the file with a reason. Retiring a previous version is available only to Diginoces administrators.",
    "Archivez le fichier avec une raison. Le retrait d’une version précédente est réservé aux administrateurs Diginoces.",
  ],
  [
    "This reason is stored with the file history.",
    "Cette raison est conservée dans l’historique du fichier.",
  ],
  [
    "This file is currently team only. Download and archive actions still require server-side permission.",
    "Ce fichier est actuellement réservé à l’équipe. Les actions de téléchargement et d’archivage nécessitent toujours une permission serveur.",
  ],
  [
    "Export a comma-separated CSV from Excel, Google Sheets, or Numbers. Maximum size: 5 MB.",
    "Exportez un CSV séparé par des virgules depuis Excel, Google Sheets ou Numbers. Taille maximale : 5 Mo.",
  ],
  [
    "Inspect the parsed CSV, confirm whether rows are ready for review, and add approved guests only when the session has passed review.",
    "Inspectez le CSV analysé, confirmez si les lignes sont prêtes pour revue et ajoutez les invités approuvés seulement après validation de la session.",
  ],
  [
    "This is the current evidence for the CSV before any new guest records are created.",
    "Voici la preuve actuelle du CSV avant création de nouvelles fiches invité.",
  ],
  [
    "Names, validation state, review decision, and duplicate warning for each staged row.",
    "Noms, état de validation, décision de revue et alerte de doublon pour chaque ligne préparée.",
  ],
  ["Import row", "Ligne importée"],
  ["No duplicate warning", "Aucune alerte de doublon"],
  [
    "Move this import through review without adding unapproved rows.",
    "Faites avancer cet import en revue sans ajouter de lignes non approuvées.",
  ],
  ["Review summary:", "Résumé de revue :"],
  [
    "Submit is available after preview validation. Apply is available only when at least one row has been approved.",
    "La soumission est disponible après validation de l’aperçu. L’application est disponible seulement lorsqu’au moins une ligne est approuvée.",
  ],
  [
    "Bride and groom uploads remain staged until an authorized reviewer approves rows. Rejected or held rows stay out of the guest list.",
    "Les imports mariée et marié restent en préparation jusqu’à l’approbation des lignes par un réviseur autorisé. Les lignes rejetées ou en attente restent hors de la liste d’invités.",
  ],
  [
    "Continue with the guest list or the review workspace for this import.",
    "Continuez avec la liste d’invités ou l’espace de revue de cet import.",
  ],
  [
    "Choose which source column should populate each Diginoces guest field. Validation runs after saving this mapping.",
    "Choisissez quelle colonne source remplit chaque champ invité Diginoces. La validation s’exécute après l’enregistrement de cette correspondance.",
  ],
  [
    "Leave optional fields unmapped when the CSV does not include that information.",
    "Laissez les champs facultatifs non associés lorsque le CSV ne contient pas cette information.",
  ],
  [
    "The name your team should recognize in the guest list.",
    "Le nom que votre équipe doit reconnaître dans la liste d’invités.",
  ],
  [
    "A configured title or guest type, such as Mr, Mrs, family, or VIP.",
    "Un titre ou type d’invité configuré, par exemple Monsieur, Madame, famille ou VIP.",
  ],
  [
    "Bride, groom, or both when a row needs to override the import side.",
    "Mariée, marié ou les deux lorsqu’une ligne doit remplacer le côté de l’import.",
  ],
  [
    "French, English, or another supported guest language.",
    "Français, anglais ou une autre langue invitée prise en charge.",
  ],
  [
    "Guest categories that help filtering and operations.",
    "Catégories d’invités qui facilitent le filtrage et les opérations.",
  ],
  [
    "Event names from the CSV, such as ceremony or reception.",
    "Noms d’événements du CSV, par exemple cérémonie ou réception.",
  ],
  [
    "Private notes for the Diginoces team. Guests never see these.",
    "Notes privées pour l’équipe Diginoces. Les invités ne les voient jamais.",
  ],
  ["Source column for", "Colonne source pour"],
  ["Currently matched to", "Actuellement associé à"],
  [
    "The original file is not stored here; Diginoces stores parsed rows, headers, and this mapping.",
    "Le fichier d’origine n’est pas stocké ici ; Diginoces conserve les lignes analysées, les en-têtes et cette correspondance.",
  ],
  [
    "Approve rows that can become guests, reject rows that should not be used, or hold rows that need clarification from the couple or team.",
    "Approuvez les lignes pouvant devenir des invités, rejetez celles à ne pas utiliser ou mettez en attente celles qui demandent une clarification du couple ou de l’équipe.",
  ],
  [
    "Validation and duplicate status stay visible while each reviewable row receives a decision.",
    "L’état de validation et de doublon reste visible pendant qu’une décision est prise pour chaque ligne.",
  ],
  [
    "Add context for the team before saving these row decisions.",
    "Ajoutez du contexte pour l’équipe avant d’enregistrer ces décisions de lignes.",
  ],
  [
    "Notes are attached to the import review. Keep them useful for the next person who checks this list.",
    "Les notes sont attachées à la revue d’import. Gardez-les utiles pour la prochaine personne qui vérifiera cette liste.",
  ],
  [
    "Saving decisions does not add guests yet. Approved rows can be applied from the import session after review.",
    "Enregistrer les décisions n’ajoute pas encore d’invités. Les lignes approuvées peuvent être appliquées depuis la session d’import après revue.",
  ],
  [
    "This session keeps rejected and held rows out of the guest list.",
    "Cette session garde les lignes rejetées et en attente hors de la liste d’invités.",
  ],
  [
    "Start with a CSV file or pasted rows, choose the side this list belongs to, then review column matches before any guest is added.",
    "Commencez par un CSV ou des lignes collées, choisissez le côté de cette liste, puis vérifiez les colonnes avant tout ajout d’invité.",
  ],
  [
    "Select the side this upload belongs to. The server checks that your role can create imports for that side.",
    "Sélectionnez le côté de cet import. Le serveur vérifie que votre rôle peut créer des imports pour ce côté.",
  ],
  [
    "Side ownership controls who can read, submit, and review staged rows.",
    "Le côté contrôle qui peut lire, soumettre et revoir les lignes préparées.",
  ],
  [
    "Upload a CSV file or paste spreadsheet rows. Use one source per import.",
    "Importez un CSV ou collez des lignes de tableur. Utilisez une seule source par import.",
  ],
  [
    "This name appears in import history so your team can recognize the upload.",
    "Ce nom apparaît dans l’historique d’import pour que l’équipe reconnaisse le fichier.",
  ],
  [
    "The next step maps columns and validates rows. No guest is created at upload time.",
    "L’étape suivante associe les colonnes et valide les lignes. Aucun invité n’est créé à l’import.",
  ],
  ["Review columns", "Revoir les colonnes"],
  [
    "This workflow accepts CSV files or pasted CSV rows. Excel files must be exported to CSV first.",
    "Ce flux accepte les fichiers CSV ou lignes CSV collées. Les fichiers Excel doivent d’abord être exportés en CSV.",
  ],
  [
    "Diginoces suggests mappings for names, titles, sides, events, tags, and WhatsApp numbers.",
    "Diginoces suggère les correspondances pour noms, titres, côtés, événements, tags et numéros WhatsApp.",
  ],
  [
    "Only approved rows create guests.",
    "Seules les lignes approuvées créent des invités.",
  ],
  ["Review and apply.", "Revoir et appliquer."],
  [
    "The original file is not stored here. Diginoces stores parsed rows and import metadata for review history.",
    "Le fichier d’origine n’est pas stocké ici. Diginoces conserve les lignes analysées et les métadonnées d’import pour l’historique de revue.",
  ],
  ["Invitation wording", "Texte d’invitation"],
  ["Variables for", "Variables pour"],
  ["Preview guest page for", "Prévisualiser la page invitée pour"],
  ["Back to guest profile for", "Retour à la fiche invitée pour"],
  ["Wedding celebration", "Célébration de mariage"],
  ["Public guest page preview", "Aperçu de la page invitée publique"],
  [
    "Review the exact guest-facing invitation and RSVP experience before the personal page link is shared.",
    "Revoyez l’expérience exacte d’invitation et RSVP visible par l’invité avant le partage du lien personnel.",
  ],
  [
    "This authenticated staff view does not replace the secure public link for this guest. Use it to check content, events, language, and RSVP controls before sharing.",
    "Cette vue équipe authentifiée ne remplace pas le lien public sécurisé de cet invité. Utilisez-la pour vérifier contenu, événements, langue et contrôles RSVP avant partage.",
  ],
  ["Guest-facing page", "Page visible par l’invité"],
  [
    "The framed area below uses the same public guest page component guests will see.",
    "La zone encadrée ci-dessous utilise le même composant de page publique que les invités verront.",
  ],
  [
    "RSVP choices and messages are not saved from this view.",
    "Les choix RSVP et messages ne sont pas enregistrés depuis cette vue.",
  ],
  ["Personal invitation", "Invitation personnelle"],
  [
    "Your personal invitation page is ready.",
    "Votre page d’invitation personnelle est prête.",
  ],
  [
    "Reply for each event listed below.",
    "Répondez pour chaque événement listé ci-dessous.",
  ],
  [
    "Open files shared with this guest link.",
    "Ouvrir les fichiers partagés avec ce lien invité.",
  ],
  ["Your message for the couple", "Votre message pour le couple"],
  [
    "Confirm your attendance for each event included in this invitation.",
    "Confirmez votre présence à chaque événement inclus dans cette invitation.",
  ],
  [
    "Download the files the couple or Diginoces has made available for your invitation.",
    "Téléchargez les fichiers que le couple ou Diginoces a rendus disponibles pour votre invitation.",
  ],
  [
    "Invitation download will be available later.",
    "Le téléchargement de l’invitation sera disponible plus tard.",
  ],
  [
    "Send one written message with emoji support. Audio, video, photo, and file uploads are not supported in this version.",
    "Envoyez un message écrit avec prise en charge des emojis. Audio, vidéo, photo et fichiers ne sont pas pris en charge dans cette version.",
  ],
  [
    "Message submission is unavailable in this view.",
    "L’envoi de message n’est pas disponible dans cette vue.",
  ],
  [
    "The couple will only see messages that can still be safely saved for this invitation.",
    "Le couple verra seulement les messages qui peuvent encore être enregistrés de manière sûre pour cette invitation.",
  ],
  ["Invitation guide", "Guide de l’invitation"],
  [
    "Everything on this page belongs to this personal guest link.",
    "Tout ce qui apparaît sur cette page appartient à ce lien invité personnel.",
  ],
  [
    "Keep this link private. It opens only the guest details connected to this invitation.",
    "Gardez ce lien privé. Il ouvre seulement les détails invités liés à cette invitation.",
  ],
  ["Invited events", "Événements inclus"],
  ["invited events", "événements inclus"],
  [
    "Staff preview access is permission-based. The guest still needs a separate secure public page token to open their own page.",
    "L’accès aperçu équipe dépend des permissions. L’invité a toujours besoin d’un jeton public sécurisé séparé pour ouvrir sa propre page.",
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

function assertNoExactPhraseReplacementSourceOverlap(
  exactTranslations: Record<string, string>,
  replacements: readonly (readonly [string, string])[],
) {
  const overlap = replacements
    .map(([source]) => source)
    .filter((source) =>
      Object.prototype.hasOwnProperty.call(exactTranslations, source),
    );

  if (overlap.length > 0) {
    throw new Error(
      `Duplicate exact translation sources found in phrase replacements: ${overlap.join(", ")}`,
    );
  }
}

assertNoExactPhraseReplacementSourceOverlap(
  exactEnglishToFrench,
  phraseEnglishToFrench,
);

assertPhraseReplacementOrder(phraseEnglishToFrench);

function assertUniqueExactTranslationValues(
  label: string,
  translations: Record<string, string>,
) {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];

  Object.entries(translations).forEach(([source, target]) => {
    const previousSource = seen.get(target);

    if (previousSource) {
      duplicates.push(`${target} (${previousSource}, ${source})`);
      return;
    }

    seen.set(target, source);
  });

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate exact translation values found in ${label}: ${duplicates.join(", ")}`,
    );
  }
}

assertUniqueExactTranslationValues(
  "exactEnglishToFrench",
  exactEnglishToFrench,
);

const exactFrenchToEnglish: Record<string, string> = Object.create(null);

Object.entries(exactEnglishToFrench).forEach(([english, french]) => {
  exactFrenchToEnglish[french] = english;
});

const phraseFrenchToEnglish = phraseEnglishToFrench.map(
  ([english, french]) => [french, english] as const,
);

assertNoExactPhraseReplacementSourceOverlap(
  exactFrenchToEnglish,
  phraseFrenchToEnglish,
);

assertPhraseReplacementOrder(phraseFrenchToEnglish);

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

const phraseReplacementCache = new WeakMap<
  readonly (readonly [string, string])[],
  Map<string, string>
>();
const phraseReplacementSourceCache = new WeakMap<
  readonly (readonly [string, string])[],
  Set<string>
>();
const exactStaticCopyTranslationCache = new Map<string, string>();

function hasOwnStaticTranslationKey<
  Translations extends Record<string, string>,
>(translations: Translations, key: string): key is keyof Translations & string {
  return Object.prototype.hasOwnProperty.call(translations, key);
}

function isExactPhraseReplacementValue(
  value: string,
  replacements: readonly (readonly [string, string])[],
) {
  let sources = phraseReplacementSourceCache.get(replacements);

  if (!sources) {
    sources = new Set(replacements.map(([source]) => source));
    phraseReplacementSourceCache.set(replacements, sources);
  }

  return sources.has(value);
}

function applyPhraseReplacements(
  value: string,
  replacements: readonly (readonly [string, string])[],
) {
  const canCache = isExactPhraseReplacementValue(value, replacements);

  if (!canCache) {
    return replacements.reduce(
      (current, [source, target]) => current.replaceAll(source, target),
      value,
    );
  }

  const cache = phraseReplacementCache.get(replacements) ?? new Map();
  const cached = cache.get(value);

  if (cached !== undefined) {
    return cached;
  }

  const translated = replacements.reduce(
    (current, [source, target]) => current.replaceAll(source, target),
    value,
  );

  cache.set(value, translated);
  phraseReplacementCache.set(replacements, cache);

  return translated;
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

function formatFrenchOpenSeatLabel(countValue: string) {
  return Number(countValue) === 1 ? "libre" : "libres";
}

function formatCountedLabel(
  countValue: string,
  labels: readonly [string, string],
) {
  const count = Number(countValue);

  return `${count} ${count === 1 ? labels[0] : labels[1]}`;
}

function translateCountLikeCopy(value: string, language: SupportedLanguage) {
  if (language === "fr") {
    const fieldMatch = value.match(/^Field (\d+)$/);

    if (fieldMatch) {
      return `Champ ${fieldMatch[1]}`;
    }

    const filteredRecordMatch = value.match(/^(\d+) of (\d+) records$/);

    if (filteredRecordMatch) {
      return `${filteredRecordMatch[1]} dossiers affichés sur ${filteredRecordMatch[2]}`;
    }

    const preparedMessageMatch = value.match(/^(\d+) prepared messages?$/);

    if (preparedMessageMatch) {
      return formatCountedLabel(preparedMessageMatch[1], [
        "message préparé",
        "messages préparés",
      ]);
    }

    const recentMessageMatch = value.match(/^(\d+) recent messages?$/);

    if (recentMessageMatch) {
      return formatCountedLabel(recentMessageMatch[1], [
        "message récent",
        "messages récents",
      ]);
    }

    const invitedEventMatch = value.match(/^(\d+) invited events?$/);

    if (invitedEventMatch) {
      return formatCountedLabel(invitedEventMatch[1], [
        "événement inclus",
        "événements inclus",
      ]);
    }

    const tablePositionedMatch = value.match(/^(\d+) tables? positioned$/);

    if (tablePositionedMatch) {
      return formatCountedLabel(tablePositionedMatch[1], [
        "table positionnée",
        "tables positionnées",
      ]);
    }

    const recentItemMatch = value.match(/^(\d+) recent items?$/);

    if (recentItemMatch) {
      return formatCountedLabel(recentItemMatch[1], [
        "élément récent",
        "éléments récents",
      ]);
    }

    const linkedAccountMatch = value.match(/^(\d+) linked accounts?$/);

    if (linkedAccountMatch) {
      return formatCountedLabel(linkedAccountMatch[1], [
        "compte lié",
        "comptes liés",
      ]);
    }

    const importDecisionRowsMatch = value.match(
      /^(\d+) (approved row|approved rows|rejected row|rejected rows|held row|held rows|blocked row|blocked rows|row with warnings|rows with warnings)$/,
    );

    if (importDecisionRowsMatch) {
      const labels: Record<string, [string, string]> = {
        "approved row": ["ligne approuvée", "lignes approuvées"],
        "approved rows": ["ligne approuvée", "lignes approuvées"],
        "rejected row": ["ligne rejetée", "lignes rejetées"],
        "rejected rows": ["ligne rejetée", "lignes rejetées"],
        "held row": ["ligne en attente", "lignes en attente"],
        "held rows": ["ligne en attente", "lignes en attente"],
        "blocked row": ["ligne bloquée", "lignes bloquées"],
        "blocked rows": ["ligne bloquée", "lignes bloquées"],
        "row with warnings": ["ligne avec alerte", "lignes avec alertes"],
        "rows with warnings": ["ligne avec alerte", "lignes avec alertes"],
      };

      return formatCountedLabel(
        importDecisionRowsMatch[1],
        labels[importDecisionRowsMatch[2]],
      );
    }

    const openSeatMatch = value.match(/^(\d+) open$/);

    if (openSeatMatch) {
      return `${openSeatMatch[1]} ${formatFrenchOpenSeatLabel(openSeatMatch[1])}`;
    }

    const openSeatSentenceMatch = value.match(/^(\d+) open ?\.$/);

    if (openSeatSentenceMatch) {
      return `${openSeatSentenceMatch[1]} ${formatFrenchOpenSeatLabel(openSeatSentenceMatch[1])}.`;
    }

    const openSeatTrailingMatch = value.match(/^, (\d+) open ?\.$/);

    if (openSeatTrailingMatch) {
      return `, ${openSeatTrailingMatch[1]} ${formatFrenchOpenSeatLabel(openSeatTrailingMatch[1])}.`;
    }

    const openSeatTrailingWithoutPeriodMatch = value.match(/^, (\d+) open$/);

    if (openSeatTrailingWithoutPeriodMatch) {
      return `, ${openSeatTrailingWithoutPeriodMatch[1]} ${formatFrenchOpenSeatLabel(openSeatTrailingWithoutPeriodMatch[1])}`;
    }

    const tableCapacityMatch = value.match(
      /^(\d+) \/ (\d+) active seats assigned\s*,?\s*(\d+) open ?\.$/,
    );

    if (tableCapacityMatch) {
      return `${tableCapacityMatch[1]} / ${tableCapacityMatch[2]} places actives attribuées, ${tableCapacityMatch[3]} ${formatFrenchOpenSeatLabel(tableCapacityMatch[3])}.`;
    }

    const countMatch = value.match(
      /^(\d+) (event|events|guest|guests|import|imports|row|rows|task|tasks|wedding|weddings|queue item|queue items|payment|payments|file|files|report|reports|record|records|note|notes|table|tables)$/,
    );

    if (countMatch) {
      const count = Number(countMatch[1]);
      const noun = countMatch[2];
      const labels: Record<string, [string, string]> = {
        event: ["événement", "événements"],
        events: ["événement", "événements"],
        guest: ["invité", "invités"],
        guests: ["invité", "invités"],
        import: ["import", "imports"],
        imports: ["import", "imports"],
        row: ["ligne", "lignes"],
        rows: ["ligne", "lignes"],
        task: ["tâche", "tâches"],
        tasks: ["tâche", "tâches"],
        wedding: ["mariage", "mariages"],
        weddings: ["mariage", "mariages"],
        "queue item": ["élément en file", "éléments en file"],
        "queue items": ["élément en file", "éléments en file"],
        payment: ["paiement", "paiements"],
        payments: ["paiement", "paiements"],
        file: ["fichier", "fichiers"],
        files: ["fichier", "fichiers"],
        report: ["rapport", "rapports"],
        reports: ["rapport", "rapports"],
        record: ["dossier", "dossiers"],
        records: ["dossier", "dossiers"],
        note: ["note", "notes"],
        notes: ["note", "notes"],
        table: ["table", "tables"],
        tables: ["table", "tables"],
      };

      return `${count} ${count === 1 ? labels[noun][0] : labels[noun][1]}`;
    }
  }

  if (language === "en") {
    const fieldMatch = value.match(/^Champ (\d+)$/);

    if (fieldMatch) {
      return `Field ${fieldMatch[1]}`;
    }

    const filteredRecordMatch = value.match(
      /^(\d+) dossiers affichés sur (\d+)$/,
    );

    if (filteredRecordMatch) {
      return `${filteredRecordMatch[1]} of ${filteredRecordMatch[2]} records`;
    }

    const preparedMessageMatch = value.match(/^(\d+) messages? préparés?$/);

    if (preparedMessageMatch) {
      return formatCountedLabel(preparedMessageMatch[1], [
        "prepared message",
        "prepared messages",
      ]);
    }

    const recentMessageMatch = value.match(/^(\d+) messages? récents?$/);

    if (recentMessageMatch) {
      return formatCountedLabel(recentMessageMatch[1], [
        "recent message",
        "recent messages",
      ]);
    }

    const invitedEventMatch = value.match(/^(\d+) événements? inclus?$/);

    if (invitedEventMatch) {
      return formatCountedLabel(invitedEventMatch[1], [
        "invited event",
        "invited events",
      ]);
    }

    const tablePositionedMatch = value.match(/^(\d+) tables? positionnées?$/);

    if (tablePositionedMatch) {
      return formatCountedLabel(tablePositionedMatch[1], [
        "table positioned",
        "tables positioned",
      ]);
    }

    const recentItemMatch = value.match(/^(\d+) éléments? récents?$/);

    if (recentItemMatch) {
      return formatCountedLabel(recentItemMatch[1], [
        "recent item",
        "recent items",
      ]);
    }

    const linkedAccountMatch = value.match(/^(\d+) comptes? liés?$/);

    if (linkedAccountMatch) {
      return formatCountedLabel(linkedAccountMatch[1], [
        "linked account",
        "linked accounts",
      ]);
    }

    const importDecisionRowsMatch = value.match(
      /^(\d+) (ligne approuvée|lignes approuvées|ligne rejetée|lignes rejetées|ligne en attente|lignes en attente|ligne bloquée|lignes bloquées|ligne avec alerte|lignes avec alertes)$/,
    );

    if (importDecisionRowsMatch) {
      const labels: Record<string, [string, string]> = {
        "ligne approuvée": ["approved row", "approved rows"],
        "lignes approuvées": ["approved row", "approved rows"],
        "ligne rejetée": ["rejected row", "rejected rows"],
        "lignes rejetées": ["rejected row", "rejected rows"],
        "ligne en attente": ["held row", "held rows"],
        "lignes en attente": ["held row", "held rows"],
        "ligne bloquée": ["blocked row", "blocked rows"],
        "lignes bloquées": ["blocked row", "blocked rows"],
        "ligne avec alerte": ["row with warnings", "rows with warnings"],
        "lignes avec alertes": ["row with warnings", "rows with warnings"],
      };

      return formatCountedLabel(
        importDecisionRowsMatch[1],
        labels[importDecisionRowsMatch[2]],
      );
    }

    const openSeatMatch = value.match(/^(\d+) libres?$/);

    if (openSeatMatch) {
      return `${openSeatMatch[1]} open`;
    }

    const openSeatSentenceMatch = value.match(/^(\d+) libres?\.$/);

    if (openSeatSentenceMatch) {
      return `${openSeatSentenceMatch[1]} open.`;
    }

    const openSeatTrailingMatch = value.match(/^, (\d+) libres?\.$/);

    if (openSeatTrailingMatch) {
      return `, ${openSeatTrailingMatch[1]} open.`;
    }

    const openSeatTrailingWithoutPeriodMatch = value.match(/^, (\d+) libres?$/);

    if (openSeatTrailingWithoutPeriodMatch) {
      return `, ${openSeatTrailingWithoutPeriodMatch[1]} open`;
    }

    const tableCapacityMatch = value.match(
      /^(\d+) \/ (\d+) places actives attribuées, (\d+) libres?\.$/,
    );

    if (tableCapacityMatch) {
      return `${tableCapacityMatch[1]} / ${tableCapacityMatch[2]} active seats assigned, ${tableCapacityMatch[3]} open.`;
    }
  }

  const frenchCountMatch = value.match(
    /^(\d+) (événement|événements|invité|invités|import|imports|ligne|lignes|tâche|tâches|mariage|mariages|élément en file|éléments en file|paiement|paiements|fichier|fichiers|rapport|rapports|dossier|dossiers|note|notes|table|tables)$/,
  );

  if (language === "en" && frenchCountMatch) {
    const count = Number(frenchCountMatch[1]);
    const noun = frenchCountMatch[2];
    const labels: Record<string, [string, string]> = {
      événement: ["event", "events"],
      événements: ["event", "events"],
      invité: ["guest", "guests"],
      invités: ["guest", "guests"],
      import: ["import", "imports"],
      imports: ["import", "imports"],
      ligne: ["row", "rows"],
      lignes: ["row", "rows"],
      tâche: ["task", "tasks"],
      tâches: ["task", "tasks"],
      mariage: ["wedding", "weddings"],
      mariages: ["wedding", "weddings"],
      "élément en file": ["queue item", "queue items"],
      "éléments en file": ["queue item", "queue items"],
      paiement: ["payment", "payments"],
      paiements: ["payment", "payments"],
      fichier: ["file", "files"],
      fichiers: ["file", "files"],
      rapport: ["report", "reports"],
      rapports: ["report", "reports"],
      dossier: ["record", "records"],
      dossiers: ["record", "records"],
      note: ["note", "notes"],
      notes: ["note", "notes"],
      table: ["table", "tables"],
      tables: ["table", "tables"],
    };

    return `${count} ${count === 1 ? labels[noun][0] : labels[noun][1]}`;
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
      ? hasOwnStaticTranslationKey(exactEnglishToFrench, core)
        ? exactEnglishToFrench[core as keyof typeof exactEnglishToFrench]
        : undefined
      : hasOwnStaticTranslationKey(exactFrenchToEnglish, core)
        ? exactFrenchToEnglish[core]
        : undefined;

  if (exact) {
    const cacheKey = `${language}\u0000${value}`;
    const cached = exactStaticCopyTranslationCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const translatedExact = `${leading}${exact}${trailing}`;
    exactStaticCopyTranslationCache.set(cacheKey, translatedExact);
    return translatedExact;
  }

  const translated = applyPhraseReplacements(
    translateCountLikeCopy(translateDateLikeCopy(core, language), language),
    language === "fr" ? phraseEnglishToFrench : phraseFrenchToEnglish,
  );

  const translatedValue = `${leading}${translated}${trailing}`;

  return translatedValue;
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
