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
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
