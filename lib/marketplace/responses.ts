// lib/marketplace/responses.ts
import { NextResponse } from 'next/server';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export const responses = {
  success<T>(data: T, meta?: Record<string, unknown>, status = 200) {
    const body: ApiResponse<T> = {
      success: true,
      data,
    };
    
    // Only add meta if it's provided (avoid spread on unknown type)
    if (meta && typeof meta === 'object') {
      body.meta = meta;
    }
    
    return NextResponse.json(body, { status });
  },

  created<T>(data: T, meta?: Record<string, unknown>) {
    return this.success(data, meta, 201);
  },

  badRequest(error: string, details?: unknown) {
    const body: ApiResponse = {
      success: false,
      error,
    };
    
    // Only add details if provided
    if (details !== undefined) {
      body.details = details;
    }
    
    return NextResponse.json(body, { status: 400 });
  },

  unauthorized(error = 'Unauthorized') {
    const body: ApiResponse = {
      success: false,
      error,
    };
    return NextResponse.json(body, { status: 401 });
  },

  forbidden(error = 'Forbidden') {
    const body: ApiResponse = {
      success: false,
      error,
    };
    return NextResponse.json(body, { status: 403 });
  },

  notFound(error = 'Not found') {
    const body: ApiResponse = {
      success: false,
      error,
    };
    return NextResponse.json(body, { status: 404 });
  },

  conflict(error: string) {
    const body: ApiResponse = {
      success: false,
      error,
    };
    return NextResponse.json(body, { status: 409 });
  },

  serverError(error = 'Internal server error') {
    const body: ApiResponse = {
      success: false,
      error,
    };
    return NextResponse.json(body, { status: 500 });
  },
};