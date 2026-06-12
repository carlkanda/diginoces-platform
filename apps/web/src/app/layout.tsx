import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { getAuthContext } from "@/lib/auth/auth-service";
import { getPrimaryAuthNavigationState } from "@/lib/auth/auth-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diginoces Platform",
  description: "Secure platform foundation for Diginoces wedding operations.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

async function PrimaryNavigation() {
  const authContext = await getAuthContext();
  const authNav = getPrimaryAuthNavigationState(authContext.status);

  return (
    <nav className="nav" aria-label="Primary navigation">
      <Link href="/platform">Platform</Link>
      <Link href="/platform/projects">Projects</Link>
      {authNav.showLoginLink ? (
        <Link href="/login">{authNav.loginLabel}</Link>
      ) : (
        <form action={signOut}>
          <button type="submit">{authNav.signOutLabel}</button>
        </form>
      )}
      <Link href="/api/health">Health</Link>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <span className="brand-mark">D</span>
                <span>Diginoces</span>
              </Link>
              <PrimaryNavigation />
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
