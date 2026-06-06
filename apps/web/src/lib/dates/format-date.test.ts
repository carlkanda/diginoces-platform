import { describe, expect, it } from "vitest";
import { formatDateTimeInTimeZone } from "./format-date";

describe("date formatting helpers", () => {
  it("does not throw for invalid timestamps on check-in pages", () => {
    expect(formatDateTimeInTimeZone("invalid-date", "Africa/Kinshasa")).toBe(
      "Not set",
    );
  });

  it("falls back to UTC for invalid timezone names", () => {
    expect(() =>
      formatDateTimeInTimeZone("2026-09-12T10:00:00.000Z", "Bad/Timezone"),
    ).not.toThrow();
  });
});
