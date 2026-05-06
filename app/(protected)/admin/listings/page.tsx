// app/(protected)/admin/listings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Import from local modules
import type {
  AdminListing,
  PaginationState,
  ListingStats,
  ListingsFilters,
  BulkAction,
  ReviewAction,
  AuctionAction,
} from "./_types";

import {
  STATUS_BADGE_CONFIG,
  AUCTION_STATUS_BADGE_CONFIG,
  LISTING_TYPE_BADGE_CONFIG,
  VALID_TRANSITIONS,
  AVAILABLE_STATUSES,
} from "./_constants";

import {
  StatsCards,
  ListingFilters,
  ListingsTable,
  PaginationControls,
  ReviewDialog,
  StatusChangeDialog,
  BulkStatusDialog,
  AuctionStatusDialog,
} from "./_components";

// Import the StatsCardsData type
import type { StatsCardsData } from "./_components/StatsCards";

// ============================================
// SAFE STATS MAPPER
// ============================================
function mapListingStats(stats: ListingStats | null): StatsCardsData {
  if (!stats) {
    return {
      total: 0,
      active: 0,
      pending: 0,
      revenue: 0,
    };
  }

  return {
    total: stats.total || 0,
    active: stats.byStatus?.ACTIVE || 0,
    pending: stats.byStatus?.PENDING_APPROVAL || 0,
    revenue: stats.totalValue || 0,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminListingsPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<ListingsFilters>({
    search: "",
    status: "all",
    type: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedListings, setSelectedListings] = useState<Set<string>>(
    new Set(),
  );

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    type: "status" | "review" | "bulkStatus" | "auction" | null;
    open: boolean;
  }>({ type: null, open: false });

  // Selected item state
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<ReviewAction>("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [bulkNewStatus, setBulkNewStatus] = useState("");
  const [bulkStatusReason, setBulkStatusReason] = useState("");
  const [auctionAction, setAuctionAction] = useState<AuctionAction>("LIVE");
  const [auctionReason, setAuctionReason] = useState("");

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.type !== "all" && { listingType: filters.type }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const res = await fetch(`/api/admin/listings?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");

      setListings(data.listings || []);
      setStats(data.stats || null);
      setPagination({
        ...data.pagination,
        hasNext: data.pagination.page < data.pagination.totalPages,
        hasPrev: data.pagination.page > 1,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load listings",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ============================================
  // API ACTIONS
  // ============================================
  const handleApiAction = async <T,>(
    endpoint: string,
    body: object,
    successMessage: string,
    options?: { method?: string; onSuccess?: (data: T) => void },
  ): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: options?.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      toast.success(successMessage);
      options?.onSuccess?.(data);
      resetDialogs();
      setSelectedListings(new Set());
      await fetchListings();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedListing || !newStatus) return;
    await handleApiAction(
      "/api/admin/listings/status",
      {
        listingId: selectedListing.id,
        status: newStatus,
        reason: statusChangeReason,
      },
      `Listing status changed to ${newStatus}`,
      { method: "PUT" },
    );
  };

  const handleReviewListing = async () => {
    if (!selectedListing) return;
    await handleApiAction(
      "/api/admin/listings/review",
      {
        listingId: selectedListing.id,
        action: reviewAction,
        notes: reviewNotes,
      },
      `Listing ${reviewAction === "APPROVE" ? "approved" : "rejected"} successfully`,
    );
  };

  const handleAuctionStatusChange = async () => {
    if (!selectedListing) return;
    const messages: Record<AuctionAction, string> = {
      UPCOMING: "Auction set to Upcoming",
      LIVE: "Auction is now LIVE!",
      PAUSED: "Auction paused",
      CLOSED: "Auction closed",
    };
    await handleApiAction(
      "/api/admin/listings/auction-status",
      {
        listingId: selectedListing.id,
        auctionStatus: auctionAction,
        reason: auctionReason,
      },
      messages[auctionAction],
      { method: "PUT" },
    );
  };

  const handleBulkStatusChange = async () => {
    if (selectedListings.size === 0 || !bulkNewStatus) return;
    await handleApiAction(
      "/api/admin/listings/bulk-status",
      {
        listingIds: Array.from(selectedListings),
        status: bulkNewStatus,
        reason: bulkStatusReason,
      },
      `Changed status for listings to ${bulkNewStatus}`,
      { method: "PUT" },
    );
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedListings.size === 0) return;
    await handleApiAction(
      "/api/admin/listings/bulk",
      { listingIds: Array.from(selectedListings), action },
      `Successfully ${action}ed listings`,
    );
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const resetDialogs = () => {
    setDialogState({ type: null, open: false });
    setSelectedListing(null);
    setNewStatus("");
    setStatusChangeReason("");
    setReviewNotes("");
    setBulkNewStatus("");
    setBulkStatusReason("");
    setAuctionReason("");
    setAuctionAction("LIVE");
  };

  const openDialog = (
    type: "status" | "review" | "bulkStatus" | "auction",
    listing?: AdminListing,
  ) => {
    if (listing) setSelectedListing(listing);
    setDialogState({ type, open: true });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE_CONFIG[status] || {
      variant: "outline" as const,
      label: status,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getAuctionStatusBadge = (status?: string) => {
    if (!status) return null;
    const config = AUCTION_STATUS_BADGE_CONFIG[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getListingTypeBadge = (type: string) => {
    const config = LISTING_TYPE_BADGE_CONFIG[type] || {
      label: type,
      color: "bg-gray-100 text-gray-800",
    };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    return AVAILABLE_STATUSES.filter((s) =>
      allowedTransitions.includes(s.value),
    );
  };

  const getAvailableAuctionActions = (
    listing: AdminListing,
  ): AuctionAction[] => {
    if (listing.status !== "ACTIVE" || listing.listingType !== "OPEN_BIDDING")
      return [];

    const actions: AuctionAction[] = [];
    const current = listing.auctionStatus;

    if (current !== "UPCOMING") actions.push("UPCOMING");
    if (current !== "LIVE") actions.push("LIVE");
    if (current === "LIVE") actions.push("PAUSED");
    if (current === "LIVE" || current === "PAUSED") actions.push("CLOSED");

    return actions;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedListings(
      checked ? new Set(listings.map((l) => l.id)) : new Set(),
    );
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedListings((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleViewListing = (id: string) => {
    router.push(`/marketplace/listings/${id}`);
  };

  const handleApproveListing = (listing: AdminListing) => {
    setSelectedListing(listing);
    setReviewAction("APPROVE");
    openDialog("review", listing);
  };

  const handleRejectListing = (listing: AdminListing) => {
    setSelectedListing(listing);
    setReviewAction("REJECT");
    openDialog("review", listing);
  };

  const handleCloseListing = (listing: AdminListing) => {
    setSelectedListing(listing);
    setNewStatus("CLOSED");
    openDialog("status", listing);
  };

  const handleChangeStatus = (listing: AdminListing) => {
    openDialog("status", listing);
  };

  const handleAuctionAction = (
    listing: AdminListing,
    action: AuctionAction,
  ) => {
    setSelectedListing(listing);
    setAuctionAction(action);
    openDialog("auction", listing);
  };

  const selectedCount = selectedListings.size;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6 p-6 mt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Listings Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and review land listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchListings}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - Using mapper for type safety */}
      <StatsCards stats={mapListingStats(stats)} />

      {/* Filters */}
      <ListingFilters
        filters={filters}
        selectedCount={selectedCount}
        onFiltersChange={setFilters}
        onFetch={fetchListings}
        onBulkApprove={() => handleBulkAction("approve")}
        onBulkReject={() => handleBulkAction("reject")}
        onBulkStatusChange={() => openDialog("bulkStatus")}
      />

      {/* Listings Table */}
      <ListingsTable
        listings={listings}
        selectedListings={selectedListings}
        loading={loading}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={handleViewListing}
        onApprove={handleApproveListing}
        onReject={handleRejectListing}
        onClose={handleCloseListing}
        onChangeStatus={handleChangeStatus}
        onAuctionAction={handleAuctionAction}
        getStatusBadge={getStatusBadge}
        getAuctionStatusBadge={getAuctionStatusBadge}
        getListingTypeBadge={getListingTypeBadge}
        getAvailableAuctionActions={getAvailableAuctionActions}
      />

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onLimitChange={(limit) =>
          setPagination({ ...pagination, limit, page: 1 })
        }
      />

      {/* Dialogs */}
      <ReviewDialog
        open={dialogState.type === "review" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        selectedListing={selectedListing}
        reviewAction={reviewAction}
        reviewNotes={reviewNotes}
        setReviewNotes={setReviewNotes}
        onConfirm={handleReviewListing}
        loading={actionLoading}
      />

      <StatusChangeDialog
        open={dialogState.type === "status" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        selectedListing={selectedListing}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        statusChangeReason={statusChangeReason}
        setStatusChangeReason={setStatusChangeReason}
        onConfirm={handleStatusChange}
        getStatusBadge={getStatusBadge}
        getAvailableStatuses={getAvailableStatuses}
        loading={actionLoading}
      />

      <BulkStatusDialog
        open={dialogState.type === "bulkStatus" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        count={selectedCount}
        bulkNewStatus={bulkNewStatus}
        setBulkNewStatus={setBulkNewStatus}
        bulkStatusReason={bulkStatusReason}
        setBulkStatusReason={setBulkStatusReason}
        onConfirm={handleBulkStatusChange}
        loading={actionLoading}
      />

      <AuctionStatusDialog
        open={dialogState.type === "auction" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        selectedListing={selectedListing}
        auctionAction={auctionAction}
        auctionReason={auctionReason}
        setAuctionReason={setAuctionReason}
        onConfirm={handleAuctionStatusChange}
        getAuctionStatusBadge={getAuctionStatusBadge}
        loading={actionLoading}
      />
    </div>
  );
}
