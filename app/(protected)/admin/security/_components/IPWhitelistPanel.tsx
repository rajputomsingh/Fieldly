// app/(protected)/admin/security/_components/IPWhitelistPanel.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  Plus,
  Trash2,
  Edit,
  Search,
  Shield,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import type { WhitelistedIP, PaginationState } from "../_types";

export default function IPWhitelistPanel() {
  const [loading, setLoading] = useState(true);
  const [ips, setIps] = useState<WhitelistedIP[]>([]);
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0 });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIP, setEditingIP] = useState<WhitelistedIP | null>(null);
  const [formData, setFormData] = useState({
    ipAddress: "",
    description: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIPs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/security/ip-whitelist?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIps(data.ips || []);
      setStats(data.stats || { total: 0, enabled: 0, disabled: 0 });
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.page < data.pagination.totalPages,
        hasPrev: data.pagination.page > 1,
      });
    } catch (err) {
      toast.error("Failed to fetch IP whitelist");
      console.error("IP whitelist fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchIPs();
  }, [fetchIPs]);

  const handleAddIP = async () => {
    if (!formData.ipAddress) {
      toast.error("IP address is required");
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(formData.ipAddress)) {
      toast.error("Invalid IP address format");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/ip-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("IP added to whitelist");
      setDialogOpen(false);
      setFormData({ ipAddress: "", description: "" });
      setEditingIP(null);
      fetchIPs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add IP");
      console.error("Add IP error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveIP = async (ip: string) => {
    if (!confirm(`Are you sure you want to remove ${ip}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/security/ip-whitelist?ip=${encodeURIComponent(ip)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("IP removed from whitelist");
      fetchIPs();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove IP"
      );
      console.error("Remove IP error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleIP = async (ip: WhitelistedIP) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/security/ip-whitelist?ip=${encodeURIComponent(ip.ip)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !ip.enabled }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`IP ${ip.enabled ? "disabled" : "enabled"}`);
      fetchIPs();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update IP"
      );
      console.error("Toggle IP error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditIP = (ip: WhitelistedIP) => {
    setEditingIP(ip);
    setFormData({ ipAddress: ip.ip, description: ip.description || "" });
    setDialogOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total IPs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Enabled</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-500">
              {stats.enabled}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PowerOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Disabled</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-500">
              {stats.disabled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IP Whitelist
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IPs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => {
                setEditingIP(null);
                setFormData({ ipAddress: "", description: "" });
                setDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add IP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : ips.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No IPs Whitelisted
              </h3>
              <p className="text-muted-foreground mb-4">
                Add IP addresses to the whitelist to control access.
              </p>
              <Button onClick={() => {
                setEditingIP(null);
                setFormData({ ipAddress: "", description: "" });
                setDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add First IP
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ips.map((ip) => (
                  <TableRow key={ip.ip}>
                    <TableCell className="font-mono text-sm">
                      {ip.ip}
                    </TableCell>
                    <TableCell>
                      {ip.description || (
                        <span className="text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ip.enabled ? "default" : "secondary"}
                        className={ip.enabled ? "bg-green-500" : ""}
                      >
                        {ip.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ip.addedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleIP(ip)}
                        >
                          <Switch checked={ip.enabled} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditIP(ip)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIP(ip.ip)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
                of {pagination.total} IPs
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIP ? "Edit IP" : "Add IP to Whitelist"}
            </DialogTitle>
            <DialogDescription>
              Add an IP address or CIDR range to the whitelist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ip">IP Address *</Label>
              <Input
                id="ip"
                placeholder="192.168.1.1 or 10.0.0.0/24"
                value={formData.ipAddress}
                onChange={(e) =>
                  setFormData({ ...formData, ipAddress: e.target.value })
                }
                disabled={!!editingIP}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports individual IPs and CIDR notation
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Office network, VPN, etc."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingIP(null);
                setFormData({ ipAddress: "", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddIP} disabled={actionLoading}>
              {editingIP ? "Update" : "Add IP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}