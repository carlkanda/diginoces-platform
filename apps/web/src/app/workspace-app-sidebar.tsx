"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const primaryNavGroups: WorkspaceNavigationGroup[] = [
  {
    items: [
      {
        href: "/platform",
        icon: HomeIcon,
        label: "Workspace",
        match: "exact",
        tooltip: "Workspace",
      },
      {
        href: "/platform/projects",
        icon: FolderKanbanIcon,
        label: "Wedding projects",
        tooltip: "Wedding projects",
      },
      {
        href: "/platform/dashboard",
        icon: LayoutDashboardIcon,
        label: "Operations dashboard",
        match: "exact",
        tooltip: "Operations dashboard",
      },
      {
        href: "/platform/reports",
        icon: BarChart3Icon,
        label: "Reports",
        tooltip: "Reports",
      },
    ],
    label: "Command",
  },
  {
    items: [
      {
        href: "/platform/audit-logs",
        icon: ActivityIcon,
        label: "Activity trail",
        match: "exact",
        tooltip: "Activity trail",
      },
      {
        href: "/platform/partners",
        icon: Building2Icon,
        label: "Partners",
        tooltip: "Partners",
      },
    ],
    label: "Control",
  },
];

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
  showLoginLink,
  signOutLabel,
}: {
  accountLabel: string;
  showLoginLink: boolean;
  signOutLabel: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          aria-label="Diginoces home"
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
              Wedding operations
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
                <span>Sign in</span>
              </SidebarMenuButton>
            ) : (
              <form action={signOut}>
                <Button
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  variant="ghost"
                  type="submit"
                >
                  <LogOutIcon data-icon="inline-start" />
                  {signOutLabel}
                </Button>
              </form>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
