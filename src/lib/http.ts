import { NextResponse } from "next/server";

/** Parse a JSON request body; returns null when the body is missing or malformed. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function badRequest(error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status: 400 });
}

export function rateLimited(retryAfterSec: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, error: "Demo rate limit reached. Please try again later.", ...extra },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}
