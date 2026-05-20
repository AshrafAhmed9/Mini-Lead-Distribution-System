import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode)
  }
  console.error('[API Error]', error)
  return apiError('Internal server error', 500)
}
