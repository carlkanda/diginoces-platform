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

  it("reports whether text has a French translation", () => {
    expect(hasStaticTranslation("Guest list")).toBe(true);
    expect(hasStaticTranslation("Custom wedding name")).toBe(false);
  });

  it("covers login and hover guidance strings used by the simplified UI", () => {
    const translatedStrings = [
      "Sign in to the Diginoces workspace.",
      "Request a secure link or enter the six-digit code from your email.",
      "You only see weddings connected to this account. Open one to continue inside its project workspace.",
      "Start with the records most teams need first. Available actions still depend on your role.",
      "This compact view shows wording readiness, prepared messages, and work waiting for a manual send.",
      "Use this queue to see what needs attention before the team records a final sending result.",
      "Open nearby workflows without losing the current project.",
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

  it("keeps home page section arrays aligned across languages", () => {
    expect(homeCopy.fr.audience.items).toHaveLength(
      homeCopy.en.audience.items.length,
    );
    expect(homeCopy.fr.principles.items).toHaveLength(
      homeCopy.en.principles.items.length,
    );
  });
});
