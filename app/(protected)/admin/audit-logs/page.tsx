// app/(protected)/admin/audit-logs/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  Eye,
  Shield,
  User,
  Home,
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { AuditLog, PaginationState } from "@/types/admin.types";

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "VIEW_USERS", label: "View Users" },
  { value: "CREATE_USER", label: "Create User" },
  { value: "UPDATE_USER", label: "Update User" },
  { value: "DELETE_USER", label: "Delete User" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
];

const ENTITY_OPTIONS = [
  { value: "all", label: "All Entities" },
  { value: "USER", label: "User" },
  { value: "LISTING", label: "Listing" },
  { value: "APPLICATION", label: "Application" },
  { value: "PAYMENT", label: "Payment" },
  { value: "SECURITY", label: "Security" },
];

const entityIcons: Record<string, React.ElementType> = {
  USER: User,
  LISTING: Home,
  APPLICATION: FileText,
  PAYMENT: CreditCard,
  SECURITY: Shield,
};

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filterState, setFilterState] = useState({
    action: "all",
    entity: "all",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filterState.action !== "all" && { action: filterState.action }),
        ...(filterState.entity !== "all" && { entity: filterState.entity }),
        ...(filterState.startDate && { startDate: filterState.startDate }),
        ...(filterState.endDate && { endDate: filterState.endDate }),
      });

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setPagination({
        ...data.pagination,
        hasNext: data.pagination.page < data.pagination.totalPages,
        hasPrev: data.pagination.page > 1,
      });
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filterState, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "CSV", filters: filterState }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        a.click();
        toast.success("Audit logs exported successfully");
      }
    } catch {
      toast.error("Failed to export audit logs");
    }
  };

  const getActionBadge = (action: string): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      CREATE_USER: { variant: "default", label: "Create" },
      UPDATE_USER: { variant: "secondary", label: "Update" },
      DELETE_USER: { variant: "destructive", label: "Delete" },
      LOGIN: { variant: "outline", label: "Login" },
      LOGOUT: { variant: "outline", label: "Logout" },
    };
    return config[action] || { variant: "outline", label: action };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all admin activities</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={filterState.action}
              onValueChange={(value) => setFilterState({ ...filterState, action: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterState.entity}
              onValueChange={(value) => setFilterState({ ...filterState, entity: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterState.startDate}
              onChange={(e) => setFilterState({ ...filterState, startDate: e.target.value })}
              className="w-[150px]"
            />
            <Input
              type="date"
              value={filterState.endDate}
              onChange={(e) => setFilterState({ ...filterState, endDate: e.target.value })}
              className="w-[150px]"
            />
            <Button variant="outline" onClick={fetchLogs}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <div className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const EntityIcon = entityIcons[log.entity] || History;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={actionBadge.variant}>{actionBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4" />
                          <span>{log.entity}</span>
                          {log.entityId && (
                            <span className="text-xs text-gray-500">{log.entityId.slice(-8)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{log.admin?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{log.admin?.email}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.ipAddress}</code>
                      </TableCell>
                      <TableCell>
                        {log.changes && (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Changes
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                        <p className="text-xs text-gray-500">{format(new Date(log.createdAt), "h:mm a")}</p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!pagination.hasPrev}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={!pagination.hasNext}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}