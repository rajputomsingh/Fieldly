// POST /api/marketplace/[id]/bids - Place a Bid
import { NextRequest } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/service';
import { BidSchema } from '@/lib/marketplace/validation';
import { responses } from '@/lib/marketplace/responses';
import { logger } from '@/lib/marketplace/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validation = BidSchema.safeParse(body);
    if (!validation.success) {
      return responses.badRequest('Invalid bid data', validation.error.issues);
    }
    
    const result = await marketplaceService.placeBid(id, validation.data);
    return responses.created(result);
  } catch (error) {
    logger.error('Place bid API error', error as Error);
    if (error instanceof Error) {
      if (error.message.includes('Transaction failed')) {
        return responses.conflict('Transaction failed. Please try again.');
      }
      return responses.badRequest(error.message);
    }
    return responses.serverError('Failed to place bid');
  }
}