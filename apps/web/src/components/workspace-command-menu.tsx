"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ActivityIcon,
  BarChart3Icon,
  BookOpenTextIcon,
  Building2Icon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MailIcon,
  MessageSquareTextIcon,
  QrCodeIcon,
  SearchIcon,
  SearchXIcon,
  ShieldCheckIcon,
  Table2Icon,
  UploadIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { OperationalEmptyState } from "@/components/operational-empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SupportedLanguage } from "@/lib/i18n/config";
import {
  getWorkspaceCommandGroups,
  getWorkspaceRouteContext,
  type WorkspaceCommandIcon,
  type WorkspaceCommandItem,
} from "@/lib/navigation/workspace-command";

type WorkspaceCommandMenuCopy = {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  inputPlaceholder: string;
  open: string;
  permissionNote: string;
  shortcut: string;
  shortcutHint: string;
  title: string;
  trigger: string;
};

const commandMenuCopy: Record<SupportedLanguage, WorkspaceCommandMenuCopy> = {
  en: {
    description:
      "Find the right wedding, event, guest, invitation, message, report, or control area without learning the whole navigation first.",
    emptyDescription:
      "Try a workflow word such as guests, RSVP, imports, invitations, messages, seating, check-in, reports, or partners.",
    emptyTitle: "No matching workspace area",
    inputPlaceholder: "Search wedding operations...",
    open: "Open",
    permissionNote:
      "Search opens the destination; sensitive records still follow your role, MFA, and project access.",
    shortcut: "Ctrl K",
    shortcutHint: "Open quick navigation with Ctrl or Command plus K",
    title: "Search Diginoces",
    trigger: "Search workspace",
  },
  fr: {
    description:
      "Trouvez le bon mariage, événement, invité, invitation, message, rapport ou contrôle sans connaître toute la navigation.",
    emptyDescription:
      "Essayez un mot de travail comme invités, RSVP, imports, invitations, messages, placement, accueil, rapports ou partenaires.",
    emptyTitle: "Aucune zone trouvée",
    inputPlaceholder: "Rechercher dans les opérations...",
    open: "Ouvrir",
    permissionNote:
      "La recherche ouvre la destination ; les dossiers sensibles restent limités par votre rôle, MFA et accès projet.",
    shortcut: "Ctrl K",
    shortcutHint: "Ouvrir la navigation rapide avec Ctrl ou Commande plus K",
    title: "Rechercher dans Diginoces",
    trigger: "Rechercher dans l'espace de travail",
  },
};

const commandIcons: Record<WorkspaceCommandIcon, LucideIcon> = {
  activity: ActivityIcon,
  "bar-chart": BarChart3Icon,
  "book-open": BookOpenTextIcon,
  building: Building2Icon,
  calendar: CalendarDaysIcon,
  "check-in": ClipboardCheckIcon,
  clipboard: ClipboardCheckIcon,
  "credit-card": CreditCardIcon,
  file: FileTextIcon,
  folder: FolderKanbanIcon,
  home: HomeIcon,
  layout: LayoutDashboardIcon,
  mail: MailIcon,
  message: MessageSquareTextIcon,
  qr: QrCodeIcon,
  table: Table2Icon,
  upload: UploadIcon,
  users: UsersRoundIcon,
};

function itemSearchValue(item: WorkspaceCommandItem) {
  return [item.label, item.description, item.href, ...item.keywords].join(" ");
}

export function WorkspaceCommandMenu({
  language,
}: {
  language: SupportedLanguage;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const copy = commandMenuCopy[language];
  const [open, setOpen] = useState(false);
  const groups = useMemo(
    () =>
      getWorkspaceCommandGroups({
        context: getWorkspaceRouteContext(pathname),
        language,
      }),
    [language, pathname],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return;
      }

      event.preventDefault();
      setOpen((current) => !current);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={copy.title}
              className="hidden min-w-48 justify-between sm:inline-flex lg:min-w-64"
              onClick={() => setOpen(true)}
              type="button"
              variant="outline"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <SearchIcon data-icon="inline-start" />
                <span className="truncate">{copy.trigger}</span>
              </span>
              <kbd
                className="rounded-md border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
                data-no-translate
              >
                {copy.shortcut}
              </kbd>
            </Button>
          }
        />
        <TooltipContent>{copy.shortcutHint}</TooltipContent>
      </Tooltip>
      <Button
        aria-label={copy.title}
        className="sm:hidden"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
      </Button>
      <CommandDialog
        description={copy.description}
        onOpenChange={setOpen}
        open={open}
        title={copy.title}
      >
        <Command>
          <CommandInput placeholder={copy.inputPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <OperationalEmptyState
                className="border-0 p-4"
                description={copy.emptyDescription}
                icon={SearchXIcon}
                language={language}
                title={copy.emptyTitle}
              />
            </CommandEmpty>
            {groups.map((group, groupIndex) => (
              <Fragment key={group.label}>
                {groupIndex > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group.label}>
                  {group.items.map((item) => {
                    const Icon = commandIcons[item.icon] ?? UserRoundPlusIcon;

                    return (
                      <CommandItem
                        key={`${group.label}-${item.href}`}
                        onSelect={() => navigateTo(item.href)}
                        value={itemSearchValue(item)}
                      >
                        <Icon aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="truncate font-medium">
                              {item.label}
                            </span>
                            {item.badge ? (
                              <Badge variant="secondary">{item.badge}</Badge>
                            ) : null}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                        <CommandShortcut>{copy.open}</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
          <div className="permission-scope-note flex items-start gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheckIcon aria-hidden="true" />
            <span>{copy.permissionNote}</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
