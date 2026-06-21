import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getPrimaryAuthNavigationState } from "@/lib/auth/auth-navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { cn } from "@/lib/utils";
import { WorkspaceAppSidebar } from "./workspace-app-sidebar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Diginoces Platform",
  description: "Wedding guest operations workspace for Diginoces.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

async function PrimaryNavigation() {
  const authContext = await getAuthContext();
  const authNav = getPrimaryAuthNavigationState(authContext.status);

  return (
    <nav className="flex items-center gap-2" aria-label="Primary navigation">
      <Button variant="ghost" render={<Link href="/platform" />}>
        Workspace
      </Button>
      <Button variant="ghost" render={<Link href="/platform/projects" />}>
        <span className="sm:hidden">Projects</span>
        <span className="hidden sm:inline">Wedding projects</span>
      </Button>
      {authNav.showLoginLink ? (
        <Button variant="outline" render={<Link href="/login" />}>
          <LogInIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{authNav.loginLabel}</span>
          <span className="sr-only sm:hidden">{authNav.loginLabel}</span>
        </Button>
      ) : (
        <form action={signOut}>
          <Button variant="outline" type="submit">
            <LogOutIcon data-icon="inline-start" />
            <span className="hidden sm:inline">{authNav.signOutLabel}</span>
            <span className="sr-only sm:hidden">{authNav.signOutLabel}</span>
          </Button>
        </form>
      )}
    </nav>
  );
}

async function AppSidebar() {
  const authContext = await getAuthContext();
  const authNav = getPrimaryAuthNavigationState(authContext.status);
  const accountLabel =
    authContext.status === "authenticated"
      ? authContext.email
      : "Workspace access";

  return (
    <WorkspaceAppSidebar
      accountLabel={accountLabel}
      showLoginLink={authNav.showLoginLink}
      signOutLabel={authNav.showSignOut ? authNav.signOutLabel : "Sign out"}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-20 border-b bg-background">
                <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger aria-label="Toggle navigation" />
                    <Separator
                      className="hidden h-5 sm:block"
                      orientation="vertical"
                    />
                    <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                      Event guest management
                    </span>
                  </div>
                  <PrimaryNavigation />
                </div>
              </header>
              <main className="min-h-[calc(100svh-3.5rem)] bg-background">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
