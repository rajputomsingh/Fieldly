// lib/marketplace/validation.ts
import { z } from 'zod'

export const BidSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  amount: z.coerce.number().positive('Bid amount must be positive'),
  isAutoBid: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
})

export const FeedFiltersSchema = z
  .object({
    search: z.string().nullable().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    landType: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    minSize: z.number().positive().optional(),
    maxSize: z.number().positive().optional(),
    irrigation: z.boolean().optional(),
    verifiedOnly: z.boolean().optional(),
    sortBy: z
      .enum([
        'hotnessScore',
        'newest',
        'endingSoon',
        'priceLowToHigh',
        'priceHighToLow',
        'mostBids',
      ])
      .optional()
      .default('hotnessScore'),
  })
  .refine(
    (d) =>
      d.minPrice === undefined ||
      d.maxPrice === undefined ||
      d.minPrice <= d.maxPrice,
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    }
  )
  .refine(
    (d) =>
      d.minSize === undefined ||
      d.maxSize === undefined ||
      d.minSize <= d.maxSize,
    {
      message: 'minSize cannot be greater than maxSize',
      path: ['minSize'],
    }
  )

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export const SavedListingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
})

export const AuctionFiltersSchema = z.object({
  userId: z.string().optional(),
})

export type BidInput = z.infer<typeof BidSchema>
export type FeedFilters = z.infer<typeof FeedFiltersSchema>
export type PaginationParams = z.infer<typeof PaginationSchema>
export type SavedListingInput = z.infer<typeof SavedListingSchema>