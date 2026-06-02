// app/(protected)/admin/applications/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type {
  AdminApplication,
  PaginationState,
  ApplicationStats,
  ApplicationsFilters,
  ReviewAction,
} from "./_types";

import { STATUS_BADGE_CONFIG } from "./_constants";

import {
  ApplicationStatsCards,
  ApplicationFilters,
  ApplicationsTable,
  PaginationControls,
  BulkReviewDialog,
  DeleteDialog,
} from "./_components";

export default function AdminApplicationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<ApplicationsFilters>({
    search: "",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(
    new Set(),
  );

  const [dialogState, setDialogState] = useState<{
    type: "bulkReview" | "delete" | null;
    open: boolean;
  }>({ type: null, open: false });

  const [selectedApplication, setSelectedApplication] =
    useState<AdminApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        admin: "true",
      });

      const res = await fetch(`/api/admin/applications?${params}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Failed to fetch applications");

      setApplications(data.applications || []);
      setStats(data.stats);
      setPagination({
        ...data.pagination,
        hasNext: data.pagination.page < data.pagination.totalPages,
        hasPrev: data.pagination.page > 1,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load applications",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
      setSelectedApplications(new Set());
      await fetchApplications();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication) return;
    await handleApiAction(
      "/api/admin/applications/bulk-review",
      {
        applicationIds: [selectedApplication.id],
        action: reviewAction,
        notes: reviewNotes,
      },
      `Application ${reviewAction === "APPROVE" ? "approved" : "rejected"} successfully`,
    );
  };

  const handleBulkReview = async () => {
    if (selectedApplications.size === 0) return;
    await handleApiAction(
      "/api/admin/applications/bulk-review",
      {
        applicationIds: Array.from(selectedApplications),
        action: reviewAction,
        notes: reviewNotes,
      },
      `Successfully ${reviewAction === "APPROVE" ? "approved" : "rejected"} applications`,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedApplications.size === 0) return;
    await handleApiAction(
      "/api/admin/applications/bulk-delete",
      { applicationIds: Array.from(selectedApplications) },
      "Successfully deleted applications",
      { method: "DELETE" },
    );
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    await handleApiAction(
      `/api/applications/${selectedApplication.id}`,
      {},
      "Application deleted successfully",
      { method: "DELETE" },
    );
  };

  const resetDialogs = () => {
    setDialogState({ type: null, open: false });
    setSelectedApplication(null);
    setReviewNotes("");
    setReviewAction("APPROVE");
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE_CONFIG[status] || {
      variant: "outline" as const,
      label: status,
      icon: null,
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedApplications(
      checked ? new Set(applications.map((a) => a.id)) : new Set(),
    );
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedApplications((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleViewApplication = (id: string) => {
    router.push(`/applications/${id}`);
  };

  const handleApproveSingle = (application: AdminApplication) => {
    setSelectedApplication(application);
    setReviewAction("APPROVE");
    setDialogState({ type: "bulkReview", open: true });
  };

  const handleRejectSingle = (application: AdminApplication) => {
    setSelectedApplication(application);
    setReviewAction("REJECT");
    setDialogState({ type: "bulkReview", open: true });
  };

  const handleDeleteSingle = (application: AdminApplication) => {
    setSelectedApplication(application);
    setDialogState({ type: "delete", open: true });
  };

  const selectedCount = selectedApplications.size;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Applications Management
          </h1>

          <p className="text-muted-foreground mt-1">
            Manage and review lease applications
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApplications}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && <ApplicationStatsCards stats={stats} />}

      {/* Filters */}
      <ApplicationFilters
        filters={filters}
        selectedCount={selectedCount}
        onFiltersChange={setFilters}
        onFetch={fetchApplications}
        onBulkApprove={() => {
          setReviewAction("APPROVE");
          setDialogState({ type: "bulkReview", open: true });
        }}
        onBulkReject={() => {
          setReviewAction("REJECT");
          setDialogState({ type: "bulkReview", open: true });
        }}
        onBulkDelete={() => setDialogState({ type: "delete", open: true })}
      />

      {/* Table */}
      <ApplicationsTable
        applications={applications}
        selectedApplications={selectedApplications}
        loading={loading}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={handleViewApplication}
        onApprove={handleApproveSingle}
        onReject={handleRejectSingle}
        onDelete={handleDeleteSingle}
        getStatusBadge={getStatusBadge}
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
      <BulkReviewDialog
        open={dialogState.type === "bulkReview" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        count={selectedApplication ? 1 : selectedCount}
        reviewAction={reviewAction}
        reviewNotes={reviewNotes}
        setReviewNotes={setReviewNotes}
        onConfirm={
          selectedApplication ? handleReviewApplication : handleBulkReview
        }
        loading={actionLoading}
        isSingle={!!selectedApplication}
        application={selectedApplication}
      />

      <DeleteDialog
        open={dialogState.type === "delete" && dialogState.open}
        onOpenChange={(open) => !open && resetDialogs()}
        count={selectedApplication ? 1 : selectedCount}
        isBulk={!selectedApplication}
        onConfirm={
          selectedApplication ? handleDeleteApplication : handleBulkDelete
        }
        loading={actionLoading}
      />
    </div>
  );
}
