import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }
  const message = err instanceof Error ? err.message : 'Unexpected error';
  // eslint-disable-next-line no-console
  console.error(err);
  return jsonError(message, 500);
}
