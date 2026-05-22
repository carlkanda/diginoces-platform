import type { NextRequest } from "next/server";

export class InvalidJsonBodyError extends Error {
  constructor(message = "Request body must be valid JSON.") {
    super(message);
    this.name = "InvalidJsonBodyError";
  }
}

export async function readJson(request: NextRequest) {
  const text = await request.text();

  if (text.trim().length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(text) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new InvalidJsonBodyError();
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
