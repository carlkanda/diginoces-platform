"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ActivityIcon,
  BarChart3Icon,
  Building2Icon,
  FolderKanbanIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  SparklesIcon,
  UserCogIcon,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { getShellCopy } from "@/lib/i18n/shell-copy";

type WorkspaceNavigationGroup = {
  items: {
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    match?: "exact" | "prefix";
    tooltip: string;
  }[];
  label: string;
};

function getPrimaryNavGroups(
  language: SupportedLanguage,
  showAccessControl: boolean,
): WorkspaceNavigationGroup[] {
  const copy = getShellCopy(language);
  const controlItems: WorkspaceNavigationGroup["items"] = [
    ...(showAccessControl
      ? [
          {
            href: "/platform/access",
            icon: UserCogIcon,
            label: copy.accessControl,
            match: "exact" as const,
            tooltip: copy.accessControl,
          },
        ]
      : []),
    {
      href: "/platform/audit-logs",
      icon: ActivityIcon,
      label: copy.activityTrail,
      match: "exact",
      tooltip: copy.activityTrail,
    },
    {
      href: "/platform/partners",
      icon: Building2Icon,
      label: copy.partners,
      tooltip: copy.partners,
    },
  ];

  return [
    {
      items: [
        {
          href: "/platform",
          icon: HomeIcon,
          label: copy.workspace,
          match: "exact",
          tooltip: copy.workspace,
        },
        {
          href: "/platform/projects",
          icon: FolderKanbanIcon,
          label: copy.weddingProjects,
          tooltip: copy.weddingProjects,
        },
        {
          href: "/platform/dashboard",
          icon: LayoutDashboardIcon,
          label: copy.operationsDashboard,
          match: "exact",
          tooltip: copy.operationsDashboard,
        },
        {
          href: "/platform/reports",
          icon: BarChart3Icon,
          label: copy.reports,
          tooltip: copy.reports,
        },
      ],
      label: copy.command,
    },
    {
      items: controlItems,
      label: copy.control,
    },
  ];
}

function isActivePath(
  pathname: string,
  href: string,
  match: "exact" | "prefix" = "prefix",
) {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceAppSidebar({
  accountLabel,
  language,
  showAccessControl,
  showLoginLink,
}: {
  accountLabel: string;
  language: SupportedLanguage;
  showAccessControl: boolean;
  showLoginLink: boolean;
}) {
  const pathname = usePathname();
  const copy = getShellCopy(language);
  const [accessControlLookup, setAccessControlLookup] = useState<{
    baseVisibility: boolean;
    visible: boolean;
  } | null>(null);
  const accessControlVisible = showLoginLink
    ? false
    : accessControlLookup?.baseVisibility === showAccessControl
      ? accessControlLookup.visible
      : showAccessControl;
  const primaryNavGroups = getPrimaryNavGroups(language, accessControlVisible);

  useEffect(() => {
    let isCurrent = true;

    if (showLoginLink) {
      return () => {
        isCurrent = false;
      };
    }

    const baseVisibility = showAccessControl;

    fetch("/api/platform/access-control/visibility", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(
              new Error("Access-control visibility lookup failed"),
            ),
      )
      .then((payload: unknown) => {
        if (!isCurrent) {
          return;
        }

        setAccessControlLookup({
          baseVisibility,
          visible: Boolean(
            payload &&
            typeof payload === "object" &&
            "showAccessControl" in payload &&
            payload.showAccessControl === true,
          ),
        });
      })
      .catch(() => {
        // Keep the server-derived/default visibility on transport failures.
      });

    return () => {
      isCurrent = false;
    };
  }, [showAccessControl, showLoginLink]);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          aria-label={copy.homeAria}
          className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          href="/"
        >
          <Image
            aria-hidden="true"
            className="size-9 rounded-lg bg-sidebar-foreground"
            src="/diginoces-logo.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <strong className="truncate text-sm font-semibold">
              Diginoces
            </strong>
            <small className="truncate text-xs text-sidebar-foreground/70">
              {copy.weddingOperations}
            </small>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {primaryNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(
                    pathname,
                    item.href,
                    item.match,
                  );

                  return (
                    <SidebarMenuItem key={`${group.label}-${item.label}`}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                        tooltip={item.tooltip}
                      >
                        <Icon data-icon="inline-start" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/platform" />}>
              <SparklesIcon data-icon="inline-start" />
              <span>{accountLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {showLoginLink ? (
              <SidebarMenuButton render={<Link href="/login" />}>
                <LogInIcon data-icon="inline-start" />
                <span>{copy.signIn}</span>
              </SidebarMenuButton>
            ) : (
              <form action={signOut}>
                <Button
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  variant="ghost"
                  type="submit"
                >
                  <LogOutIcon data-icon="inline-start" />
                  {copy.signOut}
                </Button>
              </form>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
