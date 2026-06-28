import { describe, expect, it } from "vitest";
import {
  DIGINOCES_OPERATING_TIME_ZONE,
  formatDateTimeInTimeZone,
  formatDiginocesDateTime,
} from "./format-date";

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

  it("formats Diginoces operational timestamps in the Kinshasa timezone", () => {
    expect(DIGINOCES_OPERATING_TIME_ZONE).toBe("Africa/Kinshasa");
    expect(formatDiginocesDateTime("2026-06-26T10:00:00.000Z", "en")).toContain(
      "11:00",
    );
  });
});
