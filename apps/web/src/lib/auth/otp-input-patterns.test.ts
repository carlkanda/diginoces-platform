import { describe, expect, it } from "vitest";
import { OTP_DIGITS_INPUT_PATTERN } from "./otp-input-patterns";

describe("OTP input pattern", () => {
  const digitsOnlyPattern = new RegExp(OTP_DIGITS_INPUT_PATTERN);

  it("accepts exactly six numeric digits", () => {
    expect(digitsOnlyPattern.test("123456")).toBe(true);
  });

  it("rejects partial or longer numeric input", () => {
    expect(digitsOnlyPattern.test("1")).toBe(false);
    expect(digitsOnlyPattern.test("12345")).toBe(false);
    expect(digitsOnlyPattern.test("1234567")).toBe(false);
  });

  it("rejects non-digit input", () => {
    expect(digitsOnlyPattern.test("12345a")).toBe(false);
    expect(digitsOnlyPattern.test("12 345")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(digitsOnlyPattern.test("")).toBe(false);
  });
});
