import { describe, expect, it, vi } from "vitest";
import {
  getStableLocalizationSource,
  localizeAttributes,
  localizeTextNode,
  localizationMutationObserverOptions,
} from "@/components/static-copy-localizer";

describe("StaticCopyLocalizer source tracking", () => {
  it("observes text-node mutations after client refreshes", () => {
    expect(localizationMutationObserverOptions.characterData).toBe(true);
    expect(localizationMutationObserverOptions.subtree).toBe(true);
  });

  it("reuses the original source when the current DOM value is the localized value", () => {
    const source =
      "Commercial: Review packages, contract status, payments, and guest-page gates.";
    const localized = "French localized commercial label";

    expect(
      getStableLocalizationSource(localized, {
        localized,
        source,
      }),
    ).toBe(source);
  });

  it("treats changed DOM text as a new source value", () => {
    expect(
      getStableLocalizationSource("Custom user-entered note", {
        localized: "Localized note",
        source: "Custom note",
      }),
    ).toBe("Custom user-entered note");
  });

  it("localizes text nodes from a stable source across language switches", () => {
    const textNode = {
      nodeValue:
        "Commercial: Review packages, contract status, payments, and guest-page gates.",
      parentElement: {
        closest: () => null,
        tagName: "DIV",
      },
    } as unknown as Text;

    localizeTextNode(textNode, "fr");

    expect(textNode.nodeValue).toBe(
      "Contrats et paiements : Vérifiez les forfaits, contrats, paiements et accès aux pages invités.",
    );

    localizeTextNode(textNode, "en");

    expect(textNode.nodeValue).toBe(
      "Commercial: Review packages, contract status, payments, and guest-page gates.",
    );
  });

  it("preserves text nodes inside no-translate boundaries", () => {
    const textNode = {
      nodeValue: "Commercial",
      parentElement: {
        closest: (selector: string) =>
          selector === "[data-no-translate]" ? {} : null,
        tagName: "DIV",
      },
    } as unknown as Text;

    localizeTextNode(textNode, "fr");

    expect(textNode.nodeValue).toBe("Commercial");
  });

  it("handles empty and null text node values safely", () => {
    const emptyTextNode = {
      nodeValue: "",
      parentElement: {
        closest: () => null,
        tagName: "DIV",
      },
    } as unknown as Text;
    const nullTextNode = {
      nodeValue: null,
      parentElement: {
        closest: () => null,
        tagName: "DIV",
      },
    } as unknown as Text;

    localizeTextNode(emptyTextNode, "fr");
    localizeTextNode(nullTextNode, "fr");

    expect(emptyTextNode.nodeValue).toBe("");
    expect(nullTextNode.nodeValue).toBeNull();
  });

  it("maintains text-node state across repeated language changes", () => {
    const textNode = {
      nodeValue: "Open workspace",
      parentElement: {
        closest: () => null,
        tagName: "DIV",
      },
    } as unknown as Text;

    localizeTextNode(textNode, "fr");
    expect(textNode.nodeValue).toBe("Ouvrir l’espace");

    localizeTextNode(textNode, "en");
    expect(textNode.nodeValue).toBe("Open workspace");

    localizeTextNode(textNode, "fr");
    expect(textNode.nodeValue).toBe("Ouvrir l’espace");

    localizeTextNode(textNode, "en");

    expect(textNode.nodeValue).toBe("Open workspace");
  });

  it("keeps translated attributes independent on the same element", () => {
    const attributes = new Map<string, string>([
      ["aria-label", "Open workspace"],
      [
        "title",
        "Commercial: Review packages, contract status, payments, and guest-page gates.",
      ],
    ]);
    const element = {
      closest: () => null,
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => {
        attributes.set(name, value);
      },
      tagName: "BUTTON",
    };
    const root = {
      querySelectorAll: () => [element],
    } as unknown as ParentNode;

    localizeAttributes(root, "fr");

    expect(attributes.get("aria-label")).toBe("Ouvrir l’espace");
    expect(attributes.get("title")).toBe(
      "Contrats et paiements : Vérifiez les forfaits, contrats, paiements et accès aux pages invités.",
    );

    localizeAttributes(root, "en");

    expect(attributes.get("aria-label")).toBe("Open workspace");
    expect(attributes.get("title")).toBe(
      "Commercial: Review packages, contract status, payments, and guest-page gates.",
    );
  });

  it("clears stale attribute state when an attribute is temporarily missing", async () => {
    vi.resetModules();
    vi.doMock("@/lib/i18n/static-translations", () => ({
      translateStaticCopy: (value: string, language: "en" | "fr") => {
        if (language === "fr" && value === "Old source") {
          return "Translated old source";
        }

        if (language === "en" && value === "Old source") {
          return "English from old source";
        }

        return value;
      },
    }));

    const testGlobal = globalThis as typeof globalThis & {
      Element?: typeof Element;
    };
    const originalElement = testGlobal.Element;

    class TestElement {
      private readonly attributes = new Map<string, string>([
        ["aria-label", "Old source"],
      ]);
      readonly tagName = "BUTTON";

      closest() {
        return null;
      }

      getAttribute(name: string) {
        return this.attributes.get(name) ?? null;
      }

      querySelectorAll() {
        return [] as Element[];
      }

      removeAttribute(name: string) {
        this.attributes.delete(name);
      }

      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      }
    }

    Object.defineProperty(testGlobal, "Element", {
      configurable: true,
      value: TestElement,
    });

    try {
      const { localizeAttributes: localizeAttributesWithMock } =
        await import("@/components/static-copy-localizer");
      const element = new TestElement();
      const root = element as unknown as ParentNode;

      localizeAttributesWithMock(root, "fr");
      expect(element.getAttribute("aria-label")).toBe("Translated old source");

      element.removeAttribute("aria-label");
      localizeAttributesWithMock(root, "en");

      element.setAttribute("aria-label", "Translated old source");
      localizeAttributesWithMock(root, "en");

      expect(element.getAttribute("aria-label")).toBe("Translated old source");
    } finally {
      if (originalElement) {
        Object.defineProperty(testGlobal, "Element", {
          configurable: true,
          value: originalElement,
        });
      } else {
        Reflect.deleteProperty(testGlobal, "Element");
      }

      vi.doUnmock("@/lib/i18n/static-translations");
      vi.resetModules();
    }
  });
});
