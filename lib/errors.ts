// lib/errors.ts
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Custom application error class
 */
export class AppError extends Error {
  statusCode: number
  code?: string
  details?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = 'AppError'
    Error.captureStackTrace?.(this, AppError)
  }
}

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: Record<string, unknown> | Array<{ field: string; message: string }>
  statusCode?: number
}

/**
 * Structured, sanitized logging.
 * Full stack traces only in development.
 */
function logError(error: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()

  // Minimal, safe log line for production
  const safeLine = {
    timestamp,
    level: 'error',
    context: context ?? {},
    errorType: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
  }

  if (IS_PRODUCTION) {
    // Production: one-line JSON, no stack
    console.error('[API_ERROR]', JSON.stringify(safeLine))
    return
  }

  // Development: full detail
  console.error('[API_ERROR]', safeLine, error)
}

/**
 * Centralized error handler for API routes.
 */
export function handleError(error: unknown, context?: Record<string, unknown>) {
  logError(error, context)

  // AppError — controlled application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        statusCode: error.statusCode,
      } satisfies ApiErrorResponse,
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
        statusCode: 400,
      } satisfies ApiErrorResponse,
      { status: 400 }
    )
  }

  // Prisma known request errors — sanitized
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'A unique constraint violation occurred',
            code: 'UNIQUE_CONSTRAINT',
            statusCode: 409,
          } satisfies ApiErrorResponse,
          { status: 409 }
        )

      case 'P2025':
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
            statusCode: 404,
          } satisfies ApiErrorResponse,
          { status: 404 }
        )

      case 'P2003':
        return NextResponse.json(
          {
            error: 'Related record constraint failed',
            code: 'FOREIGN_KEY',
            statusCode: 400,
          } satisfies ApiErrorResponse,
          { status: 400 }
        )

      default:
        return NextResponse.json(
          {
            error: 'Database error occurred',
            code: 'DATABASE_ERROR',
            statusCode: 500,
          } satisfies ApiErrorResponse,
          { status: 500 }
        )
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Invalid data provided',
        code: 'INVALID_DATA',
        statusCode: 400,
      } satisfies ApiErrorResponse,
      { status: 400 }
    )
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: 'Database unavailable',
        code: 'DATABASE_CONNECTION',
        statusCode: 503,
      } satisfies ApiErrorResponse,
      { status: 503 }
    )
  }

  // Standard Error messages (heuristic mapping)
  if (error instanceof Error) {
    const msg = error.message

    if (msg.includes('not found')) {
      return NextResponse.json(
        { error: msg, code: 'NOT_FOUND', statusCode: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      )
    }
    if (/unauthorized/i.test(msg)) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 } satisfies ApiErrorResponse,
        { status: 401 }
      )
    }
    if (/forbidden/i.test(msg)) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', statusCode: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      )
    }

    // Never expose raw internal messages in production
    return NextResponse.json(
      {
        error: IS_PRODUCTION ? 'Internal server error' : msg,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      } satisfies ApiErrorResponse,
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    } satisfies ApiErrorResponse,
    { status: 500 }
  )
}

/**
 * Helpers to throw common errors
 */
export const Errors = {
  notFound: (entity: string = 'Resource') => {
    throw new AppError(`${entity} not found`, 404, 'NOT_FOUND')
  },
  unauthorized: (message: string = 'Unauthorized') => {
    throw new AppError(message, 401, 'UNAUTHORIZED')
  },
  forbidden: (message: string = 'Forbidden') => {
    throw new AppError(message, 403, 'FORBIDDEN')
  },
  badRequest: (message: string) => {
    throw new AppError(message, 400, 'BAD_REQUEST')
  },
  conflict: (message: string) => {
    throw new AppError(message, 409, 'CONFLICT')
  },
  validation: (message: string, details?: Record<string, unknown>) => {
    throw new AppError(message, 400, 'VALIDATION_ERROR', details)
  },
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error instanceof ZodError) return 'Validation failed. Please check your input.'
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'This record already exists.'
      case 'P2025':
        return 'The requested record was not found.'
      default:
        return 'A database error occurred.'
    }
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}