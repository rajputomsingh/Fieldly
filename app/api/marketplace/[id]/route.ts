import { NextRequest } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/service';
import { BidSchema } from '@/lib/marketplace/validation';
import { responses } from '@/lib/marketplace/responses';
import { logger } from '@/lib/marketplace/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get('userId') || undefined;
    const listing = await marketplaceService.getListing(id, userId);
    if (!listing) return responses.notFound('Listing not found');
    return responses.success({ listing });
  } catch (error) {
    logger.error('Listing detail API error', error as Error);
    return responses.serverError('Failed to fetch listing details');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auction = await marketplaceService.getAuction(id);
    if (!auction) return responses.notFound('Auction not found');
    return responses.success(auction);
  } catch (error) {
    logger.error('Auction room API error', error as Error);
    return responses.serverError('Failed to fetch auction data');
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = BidSchema.safeParse(body);
    if (!validation.success) return responses.badRequest('Invalid bid data', validation.error.issues);
    const result = await marketplaceService.placeBid(id, validation.data);
    return responses.success(result);
  } catch (error) {
    logger.error('Place bid API error', error as Error);
    if (error instanceof Error) {
      if (error.message.includes('Transaction failed')) return responses.conflict('Transaction failed. Please try again.');
      return responses.badRequest(error.message);
    }
    return responses.serverError('Failed to place bid');
  }
}