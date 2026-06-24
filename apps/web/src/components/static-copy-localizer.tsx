"use client";

import { useEffect } from "react";
import { getLanguageHtmlLang, type SupportedLanguage } from "@/lib/i18n/config";
import { translateStaticCopy } from "@/lib/i18n/static-translations";

const textExcludedTags = new Set([
  "CODE",
  "INPUT",
  "KBD",
  "PRE",
  "SCRIPT",
  "SELECT",
  "STYLE",
  "SVG",
  "TEXTAREA",
]);

const attributeExcludedTags = new Set([
  "CODE",
  "KBD",
  "PRE",
  "SCRIPT",
  "SELECT",
  "STYLE",
  "SVG",
]);

const translatedAttributes = [
  "aria-description",
  "aria-label",
  "alt",
  "placeholder",
  "title",
] as const;
type TranslatedAttribute = (typeof translatedAttributes)[number];
const translatedAttributeSelector = translatedAttributes
  .map((name) => `[${name}]`)
  .join(",");
export type LocalizedValueState = {
  localized: string;
  source: string;
};

const textNodeLocalizationState = new WeakMap<Text, LocalizedValueState>();
const attributeLocalizationState = new WeakMap<
  Element,
  Map<TranslatedAttribute, LocalizedValueState>
>();
const localizationMeasureName = "diginoces.static-copy-localize";
const localizationStartMark = "diginoces.static-copy-localize.start";
const localizationEndMark = "diginoces.static-copy-localize.end";
export const localizationMutationObserverOptions: MutationObserverInit = {
  attributeFilter: [...translatedAttributes],
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

function safeTranslateStaticCopy(value: string, language: SupportedLanguage) {
  try {
    return translateStaticCopy(value, language);
  } catch {
    return value;
  }
}

function measureLocalization(run: () => void) {
  if (
    typeof performance === "undefined" ||
    typeof performance.mark !== "function" ||
    typeof performance.measure !== "function"
  ) {
    run();
    return;
  }

  performance.clearMarks(localizationStartMark);
  performance.clearMarks(localizationEndMark);
  performance.clearMeasures(localizationMeasureName);
  performance.mark(localizationStartMark);
  run();
  performance.mark(localizationEndMark);
  // Stable measure name for production profiling of high-churn pages.
  performance.measure(
    localizationMeasureName,
    localizationStartMark,
    localizationEndMark,
  );
  performance.clearMarks(localizationStartMark);
  performance.clearMarks(localizationEndMark);
}

function hasNoTranslateBoundary(element: Element | null) {
  if (!element) {
    return true;
  }

  return element.closest("[data-no-translate]") !== null;
}

function shouldSkipTextElement(element: Element | null) {
  return (
    !element ||
    textExcludedTags.has(element.tagName) ||
    hasNoTranslateBoundary(element)
  );
}

function shouldSkipAttributeElement(element: Element | null) {
  return (
    !element ||
    attributeExcludedTags.has(element.tagName) ||
    hasNoTranslateBoundary(element)
  );
}

function isElementRoot(root: ParentNode): root is Element {
  if (typeof Element !== "undefined") {
    return root instanceof Element;
  }

  return (
    typeof (root as Element).getAttribute === "function" &&
    typeof (root as Element).setAttribute === "function" &&
    typeof (root as Element).tagName === "string"
  );
}

function getAttributeLocalizationElements(root: ParentNode) {
  const descendants = Array.from(
    root.querySelectorAll(translatedAttributeSelector),
  );

  if (!isElementRoot(root)) {
    return descendants;
  }

  return [root, ...descendants.filter((element) => element !== root)];
}

export function getStableLocalizationSource(
  currentValue: string,
  state: LocalizedValueState | undefined,
) {
  if (state && currentValue === state.localized) {
    return state.source;
  }

  return currentValue;
}

export function localizeTextNode(node: Text, language: SupportedLanguage) {
  const parent = node.parentElement;

  if (shouldSkipTextElement(parent)) {
    return;
  }

  const currentValue = node.nodeValue ?? "";
  const sourceValue = getStableLocalizationSource(
    currentValue,
    textNodeLocalizationState.get(node),
  );
  const nextValue = safeTranslateStaticCopy(sourceValue, language);

  textNodeLocalizationState.set(node, {
    localized: nextValue,
    source: sourceValue,
  });

  if (nextValue !== currentValue) {
    node.nodeValue = nextValue;
  }
}

export function localizeAttributes(
  root: ParentNode,
  language: SupportedLanguage,
) {
  getAttributeLocalizationElements(root).forEach((element) => {
    if (shouldSkipAttributeElement(element)) {
      return;
    }

    translatedAttributes.forEach((attribute) => {
      const currentValue = element.getAttribute(attribute);
      const existingAttributeState = attributeLocalizationState.get(element);

      if (!currentValue) {
        existingAttributeState?.delete(attribute);

        if (existingAttributeState?.size === 0) {
          attributeLocalizationState.delete(element);
        }

        return;
      }

      const attributeState =
        existingAttributeState ??
        new Map<TranslatedAttribute, LocalizedValueState>();
      const sourceValue = getStableLocalizationSource(
        currentValue,
        attributeState.get(attribute),
      );
      const nextValue = safeTranslateStaticCopy(sourceValue, language);

      attributeState.set(attribute, {
        localized: nextValue,
        source: sourceValue,
      });
      attributeLocalizationState.set(element, attributeState);

      if (nextValue !== currentValue) {
        element.setAttribute(attribute, nextValue);
      }
    });
  });
}

function localizeDocument(language: SupportedLanguage) {
  const htmlLang = getLanguageHtmlLang(language);

  if (document.documentElement.lang !== htmlLang) {
    document.documentElement.lang = htmlLang;
  }

  if (document.documentElement.dataset.language !== language) {
    document.documentElement.dataset.language = language;
  }

  if (document.body.dataset.language !== language) {
    document.body.dataset.language = language;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    localizeTextNode(currentNode as Text, language);
    currentNode = walker.nextNode();
  }

  localizeAttributes(document.body, language);
}

export function StaticCopyLocalizer({
  language,
}: {
  language: SupportedLanguage;
}) {
  useEffect(() => {
    let activeLanguage = language;
    let frame = 0;
    const hydrationTimers: number[] = [];

    const scheduleLocalization = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        measureLocalization(() => localizeDocument(activeLanguage));
      });
    };

    // The subtree observer keeps route text localized after client updates.
    // requestAnimationFrame coalesces bursts of mutations, but pages with
    // very frequent DOM changes should still prefer narrower no-translate
    // boundaries around high-churn regions.
    const handleMutations: MutationCallback = (mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          isElementRoot(mutation.target as ParentNode)
        ) {
          localizeAttributes(mutation.target as Element, activeLanguage);
        }
      });

      scheduleLocalization();
    };
    const observer = new MutationObserver(handleMutations);

    scheduleLocalization();
    hydrationTimers.push(
      window.setTimeout(scheduleLocalization, 0),
      window.setTimeout(scheduleLocalization, 250),
    );
    observer.observe(document.body, localizationMutationObserverOptions);

    const handleLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: SupportedLanguage }>)
        .detail;

      if (detail?.language) {
        activeLanguage = detail.language;
        scheduleLocalization();
      }
    };

    window.addEventListener("diginoces:language-change", handleLanguageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener(
        "diginoces:language-change",
        handleLanguageChange,
      );
      hydrationTimers.forEach((timer) => window.clearTimeout(timer));

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [language]);

  return null;
}
