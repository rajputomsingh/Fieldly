// app/(protected)/admin/users/_components/UserFilters.tsx
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
import { Search, Filter } from "lucide-react";
import { ROLE_OPTIONS, STATUS_OPTIONS } from "../_constants";
import type { UserFilters as UserFiltersType } from "../_types";

interface UserFiltersProps {
  filters: UserFiltersType;
  selectedCount: number;
  onFiltersChange: (filters: UserFiltersType) => void;
  onFetch: () => void;
  onBulkAction: () => void;
}

export function UserFilters({
  filters,
  selectedCount,
  onFiltersChange,
  onFetch,
  onBulkAction,
}: UserFiltersProps) {
  return (
    <Card
      className="
    rounded-3xl
    border border-white/40 dark:border-white/10
    bg-white/80 dark:bg-gray-900/80
    backdrop-blur-xl
    shadow-lg
  "
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  search: e.target.value,
                })
              }
              className="
            h-11
            pl-11
            rounded-2xl
            bg-gray-50/50 dark:bg-gray-800/50
            border-gray-200 dark:border-gray-700
          "
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
            <Select
              value={filters.role}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  role: value,
                })
              }
            >
              <SelectTrigger
                className="
              w-full
              lg:w-[160px]
              h-11
              rounded-2xl
              bg-gray-50/50 dark:bg-gray-800/50
            "
              >
                <SelectValue placeholder="Role" />
              </SelectTrigger>

              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value,
                })
              }
            >
              <SelectTrigger
                className="
              w-full
              lg:w-[160px]
              h-11
              rounded-2xl
              bg-gray-50/50 dark:bg-gray-800/50
            "
              >
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
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onFetch}
              className="
            h-11
            rounded-2xl
            border-[#b7cf8a]/30
            hover:border-[#b7cf8a]
            hover:bg-[#b7cf8a]/5
            text-[#b7cf8a]
            w-full sm:w-auto
          "
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>

            {selectedCount > 0 && (
              <Button
                className="
              h-11
              rounded-2xl
              w-full sm:w-auto
            "
                onClick={onBulkAction}
              >
                Bulk Action ({selectedCount})
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
