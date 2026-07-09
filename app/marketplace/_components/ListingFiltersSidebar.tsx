// app/(marketplace)/_components/ListingFiltersSidebar.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS, LAND_TYPES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { FeedFilters } from '@/lib/marketplace/validation';

// ============================================================
// TYPES
// ============================================================
interface ListingFiltersSidebarProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  variant?: "desktop" | "mobile";
}

// ============================================================
// FILTER CONTENT (Shared between desktop and mobile)
// ============================================================
interface FilterContentProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
}

function FilterContent({ filters, onChange }: FilterContentProps) {
  const [mounted] = useState(() => typeof window !== "undefined");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 1000000,
  ]);
  const [sizeRange, setSizeRange] = useState<[number, number]>([
    filters.minSize || 0,
    filters.maxSize || 1000,
  ]);

  const handleChange = (key: keyof FeedFilters, value: string | number | boolean | null | undefined) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => { onChange({ sortBy: filters.sortBy || "hotnessScore" });
    setPriceRange([0, 1000000]);
    setSizeRange([0, 1000]);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "sortBy") return false;
    return value !== undefined && value !== null && value !== "";
  });

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-20 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Land Type */}
      <div className="space-y-2">
        <Label>Land Type</Label>
        <Select
          value={filters.landType || "all"}
          onValueChange={(value) => handleChange("landType", value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LAND_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
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
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          onValueCommit={() => {
            handleChange("minPrice", priceRange[0]);
            handleChange("maxPrice", priceRange[1]);
          }}
          className="py-4"
        />
        <div className="flex items-center justify-between">
          <Badge variant="outline">₹{formatNumber(priceRange[0])}</Badge>
          <span className="text-muted-foreground text-sm">to</span>
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
          onValueChange={(value) => setSizeRange([value[0], value[1]])}
          onValueCommit={() => {
            handleChange("minSize", sizeRange[0]);
            handleChange("maxSize", sizeRange[1]);
          }}
          className="py-4"
        />
        <div className="flex items-center justify-between">
          <Badge variant="outline">{formatNumber(sizeRange[0])} acres</Badge>
          <span className="text-muted-foreground text-sm">to</span>
          <Badge variant="outline">{formatNumber(sizeRange[1])} acres</Badge>
        </div>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-3">
        <Label>Location</Label>
        <Input
          placeholder="State"
          value={filters.state || ""}
          onChange={(e) => handleChange("state", e.target.value || null)}
        />
        <Input
          placeholder="District"
          value={filters.district || ""}
          onChange={(e) => handleChange("district", e.target.value || null)}
        />
      </div>

      <Separator />

      {/* Additional Filters */}
      <div className="space-y-3">
        <Label className="text-base">Additional</Label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="irrigation-sidebar"
            checked={filters.irrigation || false}
            onChange={(e) => handleChange("irrigation", e.target.checked)}
            className="rounded border-gray-300 h-4 w-4"
          />
          <Label htmlFor="irrigation-sidebar" className="text-sm font-normal cursor-pointer">
            Irrigation Available
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="verifiedOnly-sidebar"
            checked={filters.verifiedOnly || false}
            onChange={(e) => handleChange("verifiedOnly", e.target.checked)}
            className="rounded border-gray-300 h-4 w-4"
          />
          <Label htmlFor="verifiedOnly-sidebar" className="text-sm font-normal cursor-pointer">
            Verified Owners Only
          </Label>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT - Handles both Desktop Sidebar and Mobile Sheet
// ============================================================
export function ListingFiltersSidebar({ 
  filters, 
  onChange, 
  mobileOpen = false,
  onMobileOpenChange,
  variant = "desktop",
}: ListingFiltersSidebarProps) {
  const [mounted] = useState(() => typeof window !== "undefined");

  // Mobile Sheet Version
  if (variant === "mobile" && onMobileOpenChange) {
    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
      if (key === "sortBy") return false;
      return value !== undefined && value !== "" && value !== null;
    }).length;

    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden relative">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent filters={filters} onChange={onChange} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Sidebar Version
  if (!mounted) {
    return (
      <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
        <div className="sticky top-24">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-7 w-20 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
      <div className="sticky top-24">
        <FilterContent filters={filters} onChange={onChange} />
      </div>
    </aside>
  );
}

// ============================================================
// ACTIVE FILTERS BADGES COMPONENT
// ============================================================
interface ActiveFiltersProps {
  filters: FeedFilters;
  onRemoveFilter: (key: keyof FeedFilters) => void;
  onClearAll: () => void;
  formatNumber: (value: number) => string;
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll, formatNumber }: ActiveFiltersProps) {
  // FIX: Use lazy initial state instead of useEffect
  const [mounted] = useState(() => typeof window !== "undefined");

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortBy") return false;
    return value !== undefined && value !== null && value !== "";
  });

  if (!mounted) {
    return null;
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.search && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Search: {filters.search}
          <button onClick={() => onRemoveFilter("search")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.landType && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Type: {filters.landType}
          <button onClick={() => onRemoveFilter("landType")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.state && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          State: {filters.state}
          <button onClick={() => onRemoveFilter("state")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.district && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          District: {filters.district}
          <button onClick={() => onRemoveFilter("district")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.minPrice !== undefined && filters.minPrice !== null && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Min: ₹{formatNumber(filters.minPrice)}
          <button onClick={() => onRemoveFilter("minPrice")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.maxPrice !== undefined && filters.maxPrice !== null && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Max: ₹{formatNumber(filters.maxPrice)}
          <button onClick={() => onRemoveFilter("maxPrice")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.minSize !== undefined && filters.minSize !== null && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Min: {filters.minSize} acres
          <button onClick={() => onRemoveFilter("minSize")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.maxSize !== undefined && filters.maxSize !== null && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Max: {filters.maxSize} acres
          <button onClick={() => onRemoveFilter("maxSize")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.irrigation && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Irrigation
          <button onClick={() => onRemoveFilter("irrigation")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {filters.verifiedOnly && (
        <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
          Verified Only
          <button onClick={() => onRemoveFilter("verifiedOnly")} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 px-2 text-xs">
        Clear all
      </Button>
    </div>
  );
}

// ============================================================
// HEADER COMPONENT (Search + Sort) - WITH HYDRATION FIX
// ============================================================
interface MarketplaceHeaderProps {
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  mobileFiltersOpen: boolean;
  onMobileFiltersOpenChange: (open: boolean) => void;
}

export function MarketplaceHeader({
  filters,
  onFiltersChange,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
}: MarketplaceHeaderProps) {
  // FIX: Use lazy initial state instead of useEffect
  const [mounted] = useState(() => typeof window !== "undefined");

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value as FeedFilters["sortBy"] });
  };

  // Return skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-5 w-80 bg-gray-200 rounded-md mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 min-w-[200px] sm:min-w-[250px] md:w-80 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-[140px] sm:w-[180px] bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse lg:hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Marketplace
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Discover and bid on agricultural land listings
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px] md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        <Select value={filters.sortBy || "hotnessScore"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ListingFiltersSidebar
          variant="mobile"
          filters={filters}
          onChange={onFiltersChange}
          mobileOpen={mobileFiltersOpen}
          onMobileOpenChange={onMobileFiltersOpenChange}
        />
      </div>
    </div>
  );
}