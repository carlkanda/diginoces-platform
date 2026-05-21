import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diginoces Platform",
  description: "Secure platform foundation for Diginoces wedding operations.",
};

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
              <nav className="nav" aria-label="Primary navigation">
                <Link href="/platform">Platform</Link>
                <Link href="/platform/projects">Projects</Link>
                <Link href="/login">Login</Link>
                <Link href="/api/health">Health</Link>
              </nav>
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
