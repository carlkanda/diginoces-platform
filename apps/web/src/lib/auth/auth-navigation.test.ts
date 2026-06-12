import { describe, expect, it } from "vitest";
import {
  getAuthenticatedLoginRedirectPath,
  getPrimaryAuthNavigationState,
} from "@/lib/auth/auth-navigation";

describe("getPrimaryAuthNavigationState", () => {
  it("shows sign out instead of login for authenticated sessions", () => {
    expect(getPrimaryAuthNavigationState("authenticated")).toEqual({
      showLoginLink: false,
      showSignOut: true,
      signOutLabel: "Sign out",
    });
  });

  it("keeps login visible for anonymous or not-configured states", () => {
    expect(getPrimaryAuthNavigationState("anonymous")).toEqual({
      loginLabel: "Login",
      showLoginLink: true,
      showSignOut: false,
    });
    expect(getPrimaryAuthNavigationState("not_configured")).toEqual({
      loginLabel: "Login",
      showLoginLink: true,
      showSignOut: false,
    });
  });
});

describe("getAuthenticatedLoginRedirectPath", () => {
  it("preserves safe internal paths for authenticated redirect targets", () => {
    expect(getAuthenticatedLoginRedirectPath("/platform/projects")).toBe(
      "/platform/projects",
    );
    expect(getAuthenticatedLoginRedirectPath("/platform")).toBe("/platform");
  });

  it("prevents authenticated login redirects from looping through auth pages", () => {
    expect(getAuthenticatedLoginRedirectPath("/login")).toBe("/platform");
    expect(getAuthenticatedLoginRedirectPath("/login?next=%2Fplatform")).toBe(
      "/platform",
    );
    expect(getAuthenticatedLoginRedirectPath("/login/reset")).toBe("/platform");
    expect(getAuthenticatedLoginRedirectPath("/auth/callback")).toBe(
      "/platform",
    );
  });

  it("fails closed for unsafe or malformed destinations", () => {
    expect(getAuthenticatedLoginRedirectPath("https://evil.com")).toBe(
      "/platform",
    );
    expect(getAuthenticatedLoginRedirectPath("//evil.com")).toBe("/platform");
    expect(getAuthenticatedLoginRedirectPath("")).toBe("/platform");
    expect(getAuthenticatedLoginRedirectPath("relative")).toBe("/platform");
  });
});
