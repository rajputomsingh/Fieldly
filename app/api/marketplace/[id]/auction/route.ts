// GET /api/marketplace/[id]/auction - Auction Room Data
import { NextRequest } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/service';
import { responses } from '@/lib/marketplace/responses';
import { logger } from '@/lib/marketplace/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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