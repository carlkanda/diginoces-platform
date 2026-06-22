import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { StaticCopyLocalizer } from "@/components/static-copy-localizer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceCommandMenu } from "@/components/workspace-command-menu";
import { getPrimaryAuthNavigationState } from "@/lib/auth/auth-navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { getLanguageHtmlLang, type SupportedLanguage } from "@/lib/i18n/config";
import { getShellCopy } from "@/lib/i18n/shell-copy";
import { getRequestLanguage } from "@/lib/i18n/server";
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

async function PrimaryNavigation({
  language,
}: {
  language: SupportedLanguage;
}) {
  const authContext = await getAuthContext();
  const authNav = getPrimaryAuthNavigationState(authContext.status);
  const copy = getShellCopy(language);

  return (
    <nav
      className="flex items-center gap-2"
      aria-label={copy.primaryNavigationLabel}
    >
      <Button
        className="hidden lg:inline-flex"
        variant="ghost"
        render={<Link href="/platform" />}
      >
        {copy.workspace}
      </Button>
      <Button
        className="hidden md:inline-flex"
        variant="ghost"
        render={<Link href="/platform/projects" />}
      >
        <span className="sm:hidden">{copy.weddingProjectsCompact}</span>
        <span className="hidden sm:inline">{copy.weddingProjects}</span>
      </Button>
      <LanguageSwitcher label={copy.languageLabel} language={language} />
      {authNav.showLoginLink ? (
        <Button variant="outline" render={<Link href="/login" />}>
          <LogInIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{copy.signIn}</span>
          <span className="sr-only sm:hidden">{copy.signIn}</span>
        </Button>
      ) : (
        <form action={signOut}>
          <Button variant="outline" type="submit">
            <LogOutIcon data-icon="inline-start" />
            <span className="hidden sm:inline">{copy.signOut}</span>
            <span className="sr-only sm:hidden">{copy.signOut}</span>
          </Button>
        </form>
      )}
    </nav>
  );
}

async function AppSidebar({ language }: { language: SupportedLanguage }) {
  const authContext = await getAuthContext();
  const authNav = getPrimaryAuthNavigationState(authContext.status);
  const copy = getShellCopy(language);
  const accountLabel =
    authContext.status === "authenticated"
      ? authContext.email
      : copy.accountFallback;

  return (
    <WorkspaceAppSidebar
      accountLabel={accountLabel}
      language={language}
      showLoginLink={authNav.showLoginLink}
    />
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();
  const copy = getShellCopy(language);

  return (
    <html
      lang={getLanguageHtmlLang(language)}
      className={cn("font-sans", geist.variable)}
    >
      <body>
        <TooltipProvider>
          <StaticCopyLocalizer language={language} />
          <SidebarProvider>
            <AppSidebar language={language} />
            <SidebarInset>
              <header className="sticky top-0 z-20 border-b bg-background">
                <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger aria-label={copy.toggleNavigationLabel} />
                    <Separator
                      className="hidden h-5 sm:block"
                      orientation="vertical"
                    />
                    <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                      {copy.productTagline}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <WorkspaceCommandMenu language={language} />
                    <PrimaryNavigation language={language} />
                  </div>
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
