import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { OperationalEmptyState } from "@/components/operational-empty-state";
import { translateStaticCopy } from "@/lib/i18n/static-translations";

describe("OperationalEmptyState", () => {
  it("renders the required title and description", () => {
    const html = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "Create the first guest before using this view.",
        title: "No guests yet",
      }),
    );

    expect(html).toContain("No guests yet");
    expect(html).toContain("Create the first guest before using this view.");
  });

  it("renders an icon only when one is provided", () => {
    const withoutIcon = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "No icon here.",
        title: "Empty",
      }),
    );
    const withIcon = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "Search again.",
        icon: SearchIcon,
        title: "No results",
      }),
    );

    expect(withoutIcon).not.toContain("<svg");
    expect(withIcon).toContain("<svg");
  });

  it("renders next-step guidance only when provided", () => {
    const withoutNextStep = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "No guidance.",
        title: "Empty",
      }),
    );
    const withNextStep = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "The queue is clear.",
        nextStep: "Prepare the next message group.",
        title: "No messages waiting",
      }),
    );

    expect(withoutNextStep).not.toContain(
      translateStaticCopy("Suggested next step"),
    );
    expect(withNextStep).toContain(translateStaticCopy("Suggested next step"));
    expect(withNextStep).toContain("Prepare the next message group.");
  });

  it("uses the requested language for next-step guidance", () => {
    const html = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        description: "The queue is clear.",
        language: "en",
        nextStep: "Prepare the next message group.",
        title: "No messages waiting",
      }),
    );

    expect(html).toContain(translateStaticCopy("Suggested next step", "en"));
    expect(html).not.toContain(
      translateStaticCopy("Suggested next step", "fr"),
    );
  });

  it("renders an action slot", () => {
    const html = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        action: createElement(
          "a",
          { href: "/platform/projects" },
          "Open weddings",
        ),
        description: "Choose a wedding to continue.",
        title: "No wedding selected",
      }),
    );

    expect(html).toContain('href="/platform/projects"');
    expect(html).toContain("Open weddings");
  });

  it("passes custom classes through to the root state", () => {
    const html = renderToStaticMarkup(
      createElement(OperationalEmptyState, {
        className: "custom-empty-state",
        description: "A custom layout can still identify this state.",
        title: "Custom state",
      }),
    );

    expect(html).toContain("custom-empty-state");
  });
});
