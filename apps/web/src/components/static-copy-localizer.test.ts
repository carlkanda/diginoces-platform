import { describe, expect, it } from "vitest";
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
});
