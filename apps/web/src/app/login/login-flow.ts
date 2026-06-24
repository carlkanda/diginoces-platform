export type LoginStepStateInput = {
  email?: string;
  sent?: string;
};

export type RequestedLoginEmailInput = {
  draftEmail?: string;
  queryEmail?: string;
  sentEmail?: string;
};

export type LoginSearchParamValue = string | string[] | undefined;

export function getLoginSearchParamValue(value: LoginSearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function getRequestedLoginEmail({
  draftEmail,
  queryEmail,
  sentEmail,
}: RequestedLoginEmailInput) {
  return sentEmail?.trim() || draftEmail?.trim() || queryEmail?.trim() || "";
}

export function maskLoginEmail(email: string) {
  const trimmedEmail = email.trim();
  const atIndex = trimmedEmail.indexOf("@");

  if (atIndex <= 0) {
    return "";
  }

  const local = trimmedEmail.slice(0, atIndex);
  const domain = trimmedEmail.slice(atIndex + 1);

  if (!domain) {
    return "";
  }

  return `${local.slice(0, 1)}***@${domain}`;
}

export function shouldShowEmailCodeVerificationStep({
  email,
  sent,
}: LoginStepStateInput) {
  return sent === "1" && Boolean(email?.trim());
}
