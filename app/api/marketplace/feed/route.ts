// GET /api/marketplace/feed - Marketplace Feed
import { NextRequest } from 'next/server';
import { marketplaceService } from '@/lib/marketplace/service';
import { FeedFiltersSchema, PaginationSchema } from '@/lib/marketplace/validation';
import { responses } from '@/lib/marketplace/responses';
import { logger } from '@/lib/marketplace/logger';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const filters = FeedFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      landType: searchParams.get('landType') || undefined,
      state: searchParams.get('state') || undefined,
      district: searchParams.get('district') || undefined,
      minSize: searchParams.get('minSize') ? parseFloat(searchParams.get('minSize')!) : undefined,
      maxSize: searchParams.get('maxSize') ? parseFloat(searchParams.get('maxSize')!) : undefined,
      irrigation: searchParams.get('irrigation') === 'true' ? true : undefined,
      verifiedOnly: searchParams.get('verifiedOnly') === 'true' ? true : undefined,
      sortBy: searchParams.get('sortBy') || 'hotnessScore',
    });

    const pagination = PaginationSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });

    const result = await marketplaceService.getFeed(filters, pagination);
    return responses.success(result);
  } catch (error) {
    logger.error('Feed API error', error as Error);
    return responses.serverError('Failed to fetch marketplace feed');
  }
}