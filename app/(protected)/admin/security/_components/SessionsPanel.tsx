// app/(protected)/admin/security/_components/SessionsPanel.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Users,
  Search,
  Trash2,
  RefreshCw,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminSession, PaginationState } from "../_types";

export default function SessionsPanel() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    revoked: 0,
    uniqueAdmins: 0,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/security/sessions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessions(data.sessions || []);
      setStats(data.stats || { active: 0, expired: 0, revoked: 0, uniqueAdmins: 0 });
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.page < data.pagination.totalPages,
        hasPrev: data.pagination.page > 1,
      });
    } catch (err) {
      toast.error("Failed to fetch sessions");
      console.error("Sessions fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status, search]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/security/sessions?sessionId=${sessionId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Session revoked");
      fetchSessions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke session"
      );
      console.error("Revoke session error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm("Are you sure you want to revoke ALL active sessions?")) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/sessions?all=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Revoked ${data.revoked} sessions`);
      fetchSessions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke sessions"
      );
      console.error("Revoke all sessions error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAdminSessions = async (adminId: string) => {
    if (!confirm("Revoke all sessions for this admin?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/security/sessions?adminId=${adminId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Admin sessions revoked");
      fetchSessions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke sessions"
      );
      console.error("Revoke admin sessions error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent?.includes("Mobile") || userAgent?.includes("Android")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusBadge = (session: AdminSession) => {
    if (session.isRevoked) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (session.isActive) {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">Expired</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Expired</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.expired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900">
                <UserX className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Revoked</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.revoked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.uniqueAdmins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Sessions
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchSessions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAllSessions}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
              <p className="text-muted-foreground">
                {status === "active"
                  ? "No active sessions at the moment."
                  : `No ${status} sessions found.`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.admin.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.admin.email}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {session.admin.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.userAgent)}
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {session.userAgent?.split(" ").slice(0, 3).join(" ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {session.ipAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {session.location || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{getTimeAgo(session.lastActive)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.lastActive)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(session)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {session.isActive && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRevokeAdminSessions(session.admin.email)
                              }
                            >
                              <UserX className="h-4 w-4 text-orange-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} sessions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}