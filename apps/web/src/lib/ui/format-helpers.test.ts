import { describe, expect, it } from "vitest";
import { formatLabel } from "@/lib/ui/format-helpers";

describe("formatLabel", () => {
  it("uses user-facing workflow labels for common stored values", () => {
    expect(formatLabel("ready_for_review")).toBe("Ready for review");
    expect(formatLabel("manual_review")).toBe("Needs review");
    expect(formatLabel("payment_gate_locked")).toBe("Guest page locked");
    expect(formatLabel("not_configured")).toBe("Not connected");
  });

  it("keeps explicit route labels as the strongest override", () => {
    expect(
      formatLabel("pending", {
        labels: {
          pending: "Awaiting couple reply",
        },
      }),
    ).toBe("Awaiting couple reply");
  });

  it("uses own-property label overrides even when the label is falsy", () => {
    expect(
      formatLabel("pending", {
        labels: {
          pending: "",
        },
      }),
    ).toBe("");
  });

  it("ignores inherited label properties", () => {
    const inheritedLabels = Object.create({
      pending: "Inherited label",
    }) as Record<string, string>;

    expect(formatLabel("pending", { labels: inheritedLabels })).toBe("Waiting");
  });

  it("still formats unknown values and preserves technical acronyms", () => {
    expect(formatLabel("guest_rsvp_pdf")).toBe("Guest RSVP PDF");
    expect(formatLabel(null, { fallback: "No value" })).toBe("No value");
  });
});
