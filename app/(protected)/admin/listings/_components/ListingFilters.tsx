// app/(protected)/admin/listings/_components/ListingFilters.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, CheckCircle, XCircle, Edit } from "lucide-react";
import {
  STATUS_OPTIONS,
  LISTING_TYPE_OPTIONS,
  SORT_OPTIONS,
} from "../_constants";
import type { ListingsFilters } from "../_types";

interface ListingFiltersProps {
  filters: ListingsFilters;
  selectedCount: number;
  onFiltersChange: (filters: ListingsFilters) => void;
  onFetch: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkStatusChange: () => void;
}

export function ListingFilters({
  filters,
  selectedCount,
  onFiltersChange,
  onFetch,
  onBulkApprove,
  onBulkReject,
  onBulkStatusChange,
}: ListingFiltersProps) {
  return (
    <Card className="rounded-3xl border bg-background/80 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  search: e.target.value,
                })
              }
              className="pl-10 h-11 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && onFetch()}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value,
                })
              }
            >
              <SelectTrigger className="w-full xl:w-[150px] h-11 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  type: value,
                })
              }
            >
              <SelectTrigger className="w-full xl:w-[150px] h-11 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {LISTING_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    sortBy: value,
                  })
                }
              >
                <SelectTrigger className="flex-1 xl:w-[150px] h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                  })
                }
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={onFetch}
              className="h-11 rounded-xl"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 border-t pt-4">
              <span className="text-sm text-muted-foreground self-center">
                {selectedCount} selected
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkApprove}
                className="border-green-500 text-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkReject}
                className="border-red-500 text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>

              <Button variant="outline" size="sm" onClick={onBulkStatusChange}>
                <Edit className="h-4 w-4 mr-2" />
                Change Status
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
