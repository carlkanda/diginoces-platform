"use client";

import { useEffect } from "react";
import { getLanguageHtmlLang, type SupportedLanguage } from "@/lib/i18n/config";
import { translateStaticCopy } from "@/lib/i18n/static-translations";

const textExcludedTags = new Set([
  "CODE",
  "INPUT",
  "KBD",
  "OPTION",
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
  "OPTION",
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
const localizationMeasureName = "diginoces.static-copy-localize";
const localizationStartMark = "diginoces.static-copy-localize.start";
const localizationEndMark = "diginoces.static-copy-localize.end";

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

function localizeTextNode(node: Text, language: SupportedLanguage) {
  const parent = node.parentElement;

  if (shouldSkipTextElement(parent)) {
    return;
  }

  const nextValue = safeTranslateStaticCopy(node.nodeValue ?? "", language);

  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
}

function localizeAttributes(root: ParentNode, language: SupportedLanguage) {
  root
    .querySelectorAll(translatedAttributes.map((name) => `[${name}]`).join(","))
    .forEach((element) => {
      if (shouldSkipAttributeElement(element)) {
        return;
      }

      translatedAttributes.forEach((attribute) => {
        const currentValue = element.getAttribute(attribute);

        if (!currentValue) {
          return;
        }

        const nextValue = safeTranslateStaticCopy(currentValue, language);

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
    const observer = new MutationObserver(scheduleLocalization);

    scheduleLocalization();
    observer.observe(document.body, {
      attributeFilter: [...translatedAttributes],
      attributes: true,
      childList: true,
      subtree: true,
    });

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

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [language]);

  return null;
}
