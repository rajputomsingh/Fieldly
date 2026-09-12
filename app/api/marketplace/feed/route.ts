// app/api/marketplace/feed/route.ts
import { NextRequest } from 'next/server'
import { marketplaceService } from '@/lib/marketplace/service'
import {
  FeedFiltersSchema,
  PaginationSchema,
} from '@/lib/marketplace/validation'
import { responses } from '@/lib/marketplace/responses'
import { handleError } from '@/lib/errors'

function num(v: string | null): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams

    const filters = FeedFiltersSchema.parse({
      search: sp.get('search') || undefined,
      minPrice: num(sp.get('minPrice')),
      maxPrice: num(sp.get('maxPrice')),
      landType: sp.get('landType') || undefined,
      state: sp.get('state') || undefined,
      district: sp.get('district') || undefined,
      minSize: num(sp.get('minSize')),
      maxSize: num(sp.get('maxSize')),
      irrigation: sp.get('irrigation') === 'true' ? true : undefined,
      verifiedOnly: sp.get('verifiedOnly') === 'true' ? true : undefined,
      sortBy: sp.get('sortBy') || 'hotnessScore',
    })

    const pagination = PaginationSchema.parse({
      page: Number(sp.get('page') || '1'),
      limit: Number(sp.get('limit') || '20'),
    })

    const result = await marketplaceService.getFeed(filters, pagination)
    return responses.success(result)
  } catch (error) {
    return handleError(error, {
      route: '/api/marketplace/feed',
      method: 'GET',
    })
  }
}