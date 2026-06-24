import { describe, expect, it } from "vitest";
import {
  getLoginSearchParamValue,
  getRequestedLoginEmail,
  maskLoginEmail,
  shouldShowEmailCodeVerificationStep,
} from "./login-flow";

describe("login step flow", () => {
  it("normalizes duplicate search params to the first scalar value", () => {
    expect(getLoginSearchParamValue("one")).toBe("one");
    expect(getLoginSearchParamValue(["one", "two"])).toBe("one");
    expect(getLoginSearchParamValue([])).toBe("");
    expect(getLoginSearchParamValue(undefined)).toBe("");
  });

  it("recovers the email request field from sent, draft, or query state", () => {
    expect(
      getRequestedLoginEmail({
        draftEmail: " draft@example.com ",
        queryEmail: "query@example.com",
        sentEmail: " sent@example.com ",
      }),
    ).toBe("sent@example.com");
    expect(
      getRequestedLoginEmail({
        draftEmail: " draft@example.com ",
        queryEmail: "query@example.com",
      }),
    ).toBe("draft@example.com");
    expect(
      getRequestedLoginEmail({
        queryEmail: " query@example.com ",
      }),
    ).toBe("query@example.com");
    expect(getRequestedLoginEmail({})).toBe("");
  });

  it("starts on the email request step", () => {
    expect(shouldShowEmailCodeVerificationStep({})).toBe(false);
    expect(
      shouldShowEmailCodeVerificationStep({
        email: "person@example.com",
      }),
    ).toBe(false);
  });

  it("shows the email-code step only after a code request is sent", () => {
    expect(
      shouldShowEmailCodeVerificationStep({
        email: " person@example.com ",
        sent: "1",
      }),
    ).toBe(true);
  });

  it("does not show the email-code step for other sent values", () => {
    expect(
      shouldShowEmailCodeVerificationStep({
        email: "person@example.com",
        sent: "0",
      }),
    ).toBe(false);
  });

  it("fails closed without an email address", () => {
    expect(
      shouldShowEmailCodeVerificationStep({
        sent: "1",
      }),
    ).toBe(false);
    expect(
      shouldShowEmailCodeVerificationStep({
        email: " ",
        sent: "1",
      }),
    ).toBe(false);
  });

  it("masks login email addresses before rendering them in visible status copy", () => {
    expect(maskLoginEmail("person@example.com")).toBe("p***@example.com");
    expect(maskLoginEmail(" a@example.com ")).toBe("a***@example.com");
    expect(maskLoginEmail("not-an-email")).toBe("");
    expect(maskLoginEmail("person@")).toBe("");
  });
});
