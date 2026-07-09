// app/api/marketplace/saved/route.ts
import { NextRequest } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/service';
import { SavedListingSchema } from '@/lib/marketplace/validation';
import { responses } from '@/lib/marketplace/responses';
import { logger } from '@/lib/marketplace/logger';
import { getCurrentUser } from '@/lib/server/admin-guard';

/**
 * GET /api/marketplace/saved
 * Get all saved listings for the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return responses.unauthorized('Please sign in to view saved listings');
    }

    const result = await marketplaceService.getSavedListings(user.id);
    return responses.success(result);
  } catch (error) {
    logger.error('Failed to fetch saved listings', error as Error);
    return responses.serverError('Failed to fetch saved listings');
  }
}

/**
 * POST /api/marketplace/saved
 * Save a listing for the current user
 * Body: { listingId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return responses.unauthorized('Please sign in to save listings');
    }

    const body = await req.json();
    const validation = SavedListingSchema.safeParse(body);
    
    if (!validation.success) {
      return responses.badRequest(
        'Invalid request body',
        validation.error.issues
      );
    }

    const result = await marketplaceService.saveListing(
      user.id, 
      validation.data.listingId
    );

    return responses.success(result);
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to save listing', err);
    
    // Handle specific known errors
    if (err.message === 'Listing not found') {
      return responses.notFound('Listing not found');
    }
    
    return responses.serverError('Failed to save listing');
  }
}

/**
 * DELETE /api/marketplace/saved
 * Remove a saved listing for the current user
 * Body: { listingId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return responses.unauthorized('Please sign in to manage saved listings');
    }

    const body = await req.json();
    const validation = SavedListingSchema.safeParse(body);
    
    if (!validation.success) {
      return responses.badRequest(
        'Invalid request body',
        validation.error.issues
      );
    }

    const result = await marketplaceService.unsaveListing(
      user.id, 
      validation.data.listingId
    );

    return responses.success(result);
  } catch (error) {
    logger.error('Failed to remove saved listing', error as Error);
    return responses.serverError('Failed to remove saved listing');
  }
}

/**
 * OPTIONS /api/marketplace/saved
 * CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}