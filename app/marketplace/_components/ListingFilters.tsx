// app/(marketplace)/_components/ListingFilters.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import type { FeedFilters } from '@/lib/marketplace/validation';
import { LAND_TYPES } from '@/lib/constants'
import { X } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export interface ListingFiltersProps {
  filters: FeedFilters
  onChange: (filters: FeedFilters) => void
}

export function ListingFilters({ filters, onChange }: ListingFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 1000000,
  ])

  const [sizeRange, setSizeRange] = useState<[number, number]>([
    filters.minSize || 0,
    filters.maxSize || 1000,
  ])

  // FIXED: Handle null values properly
  const handleChange = (key: keyof FeedFilters, value: string | number | boolean | null | undefined) => {
    onChange({ ...filters, [key]: value })
  }

  const clearFilters = () => { onChange({ sortBy: filters.sortBy || "hotnessScore" })
    setPriceRange([0, 1000000])
    setSizeRange([0, 1000])
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]])
  }

  const handlePriceCommit = () => {
    handleChange('minPrice', priceRange[0])
    handleChange('maxPrice', priceRange[1])
  }

  const handleSizeChange = (value: number[]) => {
    setSizeRange([value[0], value[1]])
  }

  const handleSizeCommit = () => {
    handleChange('minSize', sizeRange[0])
    handleChange('maxSize', sizeRange[1])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Land Type */}
      <div className="space-y-2">
        <Label>Land Type</Label>
        <Select
          value={filters.landType || 'all'}
          onValueChange={(value) => handleChange('landType', value === 'all' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LAND_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Price Range (₹)</Label>
        <Slider
          min={0}
          max={1000000}
          step={10000}
          value={priceRange}
          onValueChange={handlePriceChange}
          onValueCommit={handlePriceCommit}
          className="py-4"
        />
        <div className="flex items-center justify-between">
          <Badge variant="outline">₹{formatNumber(priceRange[0])}</Badge>
          <span className="text-muted-foreground">to</span>
          <Badge variant="outline">₹{formatNumber(priceRange[1])}</Badge>
        </div>
      </div>

      <Separator />

      {/* Size Range */}
      <div className="space-y-4">
        <Label>Size (acres)</Label>
        <Slider
          min={0}
          max={1000}
          step={1}
          value={sizeRange}
          onValueChange={handleSizeChange}
          onValueCommit={handleSizeCommit}
          className="py-4"
        />
        <div className="flex items-center justify-between">
          <Badge variant="outline">{formatNumber(sizeRange[0])} acres</Badge>
          <span className="text-muted-foreground">to</span>
          <Badge variant="outline">{formatNumber(sizeRange[1])} acres</Badge>
        </div>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-2">
        <Label>State</Label>
        <Input
          placeholder="Enter state"
          value={filters.state || ''}
          onChange={(e) => handleChange('state', e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label>District</Label>
        <Input
          placeholder="Enter district"
          value={filters.district || ''}
          onChange={(e) => handleChange('district', e.target.value || null)}
        />
      </div>

      <Separator />

      {/* Additional Filters */}
      <div className="space-y-3">
        <Label className="text-base">Additional Filters</Label>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="irrigation"
            checked={filters.irrigation || false}
            onChange={(e) => handleChange('irrigation', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="irrigation" className="text-sm font-normal">
            Irrigation Available
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="verifiedOnly"
            checked={filters.verifiedOnly || false}
            onChange={(e) => handleChange('verifiedOnly', e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="verifiedOnly" className="text-sm font-normal">
            Verified Owners Only
          </Label>
        </div>
      </div>
    </div>
  )
}