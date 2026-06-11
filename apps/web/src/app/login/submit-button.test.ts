import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LoginSubmitButton,
  type LoginSubmitButtonProps,
} from "./submit-button";

const formStatus = vi.hoisted(() => ({
  pending: false,
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();

  return {
    ...actual,
    useFormStatus: () => ({
      action: null,
      data: null,
      method: null,
      pending: formStatus.pending,
    }),
  };
});

function renderSubmitButton(props: {
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  const buttonProps = {
    children: "Send magic link",
    className: props.className,
    disabled: props.disabled,
    pendingLabel: props.pendingLabel ?? "Sending...",
  } satisfies LoginSubmitButtonProps;

  const element = LoginSubmitButton(buttonProps);

  if (!isValidElement<ButtonElementProps>(element)) {
    throw new Error("LoginSubmitButton did not return a valid button element.");
  }

  return element;
}

type ButtonElementProps = {
  "aria-busy": boolean;
  children?: ReactNode;
  className?: string;
  disabled: boolean;
  type: "submit";
};

type StatusElementProps = {
  children?: ReactNode;
  role?: string;
};

type HiddenElementProps = {
  "aria-hidden"?: boolean;
  children?: ReactNode;
};

describe("LoginSubmitButton", () => {
  beforeEach(() => {
    formStatus.pending = false;
  });

  it("renders the default label while the form is not pending", () => {
    const button = renderSubmitButton({
      className: "button primary",
      disabled: false,
    });

    expect(button.props["aria-busy"]).toBe(false);
    expect(button.props.className).toBe("button primary");
    expect(button.props.disabled).toBe(false);
    expect(button.props.type).toBe("submit");
    expect(button.props.children).toBe("Send magic link");
  });

  it("renders the pending label, status region, and disabled state while pending", () => {
    formStatus.pending = true;

    const button = renderSubmitButton({
      className: "button",
      pendingLabel: "Sending...",
    });
    const status = button.props.children;

    expect(button.props["aria-busy"]).toBe(true);
    expect(button.props.disabled).toBe(true);
    expect(isValidElement<StatusElementProps>(status)).toBe(true);

    const statusElement = status as ReactElement<StatusElementProps>;
    const statusChildren = Children.toArray(statusElement.props.children);
    const hiddenEllipsis = statusChildren.find((child) =>
      isValidElement<HiddenElementProps>(child),
    ) as ReactElement<HiddenElementProps> | undefined;

    expect(statusElement.props.role).toBe("status");
    expect(hiddenEllipsis).toBeDefined();
    expect(hiddenEllipsis?.props["aria-hidden"]).toBe(true);
    expect(hiddenEllipsis?.props.children).toBe("...");
    expect(statusChildren).toContain("Sending...");
    expect(statusChildren).not.toContain("Send magic link");
  });

  it("respects an explicit disabled prop without changing the idle label", () => {
    const button = renderSubmitButton({
      className: "button secondary",
      disabled: true,
      pendingLabel: "Verifying...",
    });

    expect(button.props["aria-busy"]).toBe(false);
    expect(button.props.className).toBe("button secondary");
    expect(button.props.disabled).toBe(true);
    expect(button.props.children).toBe("Send magic link");
  });

  it("uses the default pending label when one is not provided", () => {
    formStatus.pending = true;

    const buttonProps = {
      children: "Send magic link",
    } satisfies LoginSubmitButtonProps;
    const button = LoginSubmitButton(buttonProps);

    if (!isValidElement<ButtonElementProps>(button)) {
      throw new Error(
        "LoginSubmitButton did not return a valid button element.",
      );
    }

    const status = button.props.children;

    expect(isValidElement<StatusElementProps>(status)).toBe(true);

    const statusElement = status as ReactElement<StatusElementProps>;
    const statusChildren = Children.toArray(statusElement.props.children);

    expect(statusChildren).toContain("Processing...");
  });
});
