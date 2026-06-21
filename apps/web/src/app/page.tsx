import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  LockKeyholeIcon,
  SparklesIcon,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getHomeCopy } from "@/lib/i18n/home-copy";
import { getRequestLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [env, language] = await Promise.all([
    getPublicEnvironment(),
    getRequestLanguage(),
  ]);
  const copy = getHomeCopy(language);

  return (
    <div className="public-route min-h-svh bg-background text-foreground">
      <section className="home-hero">
        <Image
          alt={copy.hero.alt}
          className="home-hero__image"
          fill
          priority
          sizes="100vw"
          src="/diginoces-home-hero.png"
        />
        <div className="home-hero__veil" />

        <header className="home-hero__nav">
          <Link
            aria-label="Diginoces"
            className="home-hero__brand"
            data-no-translate
            href="/"
          >
            <Image
              aria-hidden="true"
              className="home-hero__logo"
              height={40}
              src="/diginoces-logo.png"
              width={40}
              alt=""
            />
            <span>
              <strong>Diginoces</strong>
              <small>{copy.header.tagline}</small>
            </span>
          </Link>

          <nav
            aria-label={copy.header.publicNavigationLabel}
            className="home-hero__actions"
          >
            <LanguageSwitcher
              label={copy.header.languageLabel}
              language={language}
            />
            <Button
              className="home-hero__ghost-button"
              variant="outline"
              render={<Link href="/login" />}
            >
              {copy.header.signIn}
            </Button>
          </nav>
        </header>

        <div className="home-hero__content">
          <Badge className="home-hero__badge">{copy.hero.badge}</Badge>
          <h1>{copy.hero.title}</h1>
          <p>{copy.hero.body}</p>
          <div className="home-hero__cta">
            <Button size="lg" render={<Link href="/platform" />}>
              {copy.hero.primaryAction}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              className="home-hero__ghost-button"
              size="lg"
              variant="outline"
              render={<Link href="/platform/projects" />}
            >
              {copy.hero.secondaryAction}
            </Button>
          </div>
          <p className="home-hero__trust">
            <LockKeyholeIcon aria-hidden="true" />
            {copy.hero.trust}
          </p>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)]">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <SparklesIcon aria-hidden="true" />
              <span className="text-sm font-semibold">
                {env.supabaseConfigured
                  ? copy.header.discover
                  : copy.header.localPreview}
              </span>
            </div>
            <h2 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
              {copy.audience.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground text-pretty">
              {copy.audience.body}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {copy.audience.items.map((item) => (
              <Card className="shadow-none" key={item.id}>
                <CardHeader>
                  <CardTitle>
                    <h3>{item.title}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.38fr)]">
          <Card className="border-primary/15 bg-primary text-primary-foreground shadow-none">
            <CardHeader>
              <CardTitle>
                <h2 className="text-2xl leading-tight font-semibold text-balance">
                  {copy.principles.title}
                </h2>
              </CardTitle>
              <CardDescription className="max-w-3xl text-primary-foreground/82">
                {copy.principles.body}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {copy.principles.items.map((item) => (
                <div className="home-proof" key={item.id}>
                  <CheckCircle2Icon aria-hidden="true" />
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle data-no-translate>
                <h2>Diginoces</h2>
              </CardTitle>
              <CardDescription>{copy.footerNote}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button render={<Link href="/login" />}>
                {copy.header.signIn}
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button variant="outline" render={<Link href="/platform" />}>
                {copy.hero.primaryAction}
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
