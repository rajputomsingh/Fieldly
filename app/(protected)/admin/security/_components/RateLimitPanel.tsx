// app/(protected)/admin/security/_components/RateLimitPanel.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Settings,
  RotateCcw,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { RateLimitConfig, RateLimitEndpoint, ActiveRateLimit, RateLimitViolation } from "../_types";

export default function RateLimitPanel() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<RateLimitConfig>({});
  const [activeLimits, setActiveLimits] = useState<ActiveRateLimit[]>([]);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [stats, setStats] = useState({ activeLimits: 0, violations24h: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState("");
  const [formData, setFormData] = useState({
    maxRequests: 100,
    windowSeconds: 60,
    enabled: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRateLimits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security/rate-limit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfig((data.config as RateLimitConfig) || {});
      setActiveLimits(data.activeRateLimits || []);
      setViolations(data.violations || []);
      setStats(data.stats || { activeLimits: 0, violations24h: 0 });
    } catch (err) {
      toast.error("Failed to fetch rate limit data");
      console.error("Rate limit fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits();
    const interval = setInterval(fetchRateLimits, 10000);
    return () => clearInterval(interval);
  }, [fetchRateLimits]);

  const handleUpdateRateLimit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/rate-limit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: editingEndpoint,
          ...formData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Rate limit updated");
      setDialogOpen(false);
      fetchRateLimits();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update rate limit"
      );
      console.error("Update rate limit error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetRateLimits = async (key?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/security/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchRateLimits();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset rate limits"
      );
      console.error("Reset rate limits error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (endpoint: string) => {
    setEditingEndpoint(endpoint);
    const endpointConfig: RateLimitEndpoint = config[endpoint] as RateLimitEndpoint;
    setFormData({
      maxRequests: endpointConfig?.maxRequests || 100,
      windowSeconds: endpointConfig?.windowSeconds || 60,
      enabled: endpointConfig?.enabled ?? true,
    });
    setDialogOpen(true);
  };

  const getEndpointColor = (endpoint: string) => {
    const colors: Record<string, string> = {
      global: "bg-blue-100 text-blue-800",
      admin: "bg-purple-100 text-purple-800",
      api: "bg-green-100 text-green-800",
      auth: "bg-orange-100 text-orange-800",
    };
    return colors[endpoint] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Active Rate Limits
              </span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.activeLimits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                24h Violations
              </span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.violations24h}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Endpoints</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {Object.keys(config).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Rate Limit Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetRateLimits()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
              <Button variant="outline" size="sm" onClick={fetchRateLimits}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config).map(([endpoint, settings]) => (
              <Card key={endpoint} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getEndpointColor(endpoint)}>
                        {endpoint.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={settings.enabled ? "default" : "secondary"}
                      >
                        {settings.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(endpoint)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          Max Requests
                        </span>
                        <span className="font-semibold">
                          {settings.maxRequests}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${(settings.maxRequests / 1000) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          Window (seconds)
                        </span>
                        <span className="font-semibold">
                          {settings.windowSeconds}s
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${(settings.windowSeconds / 3600) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Rate Limits */}
      {activeLimits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Reset At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLimits.map((limit) => (
                  <TableRow key={limit.key}>
                    <TableCell className="font-mono text-sm">
                      {limit.key}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          limit.count > 50 ? "destructive" : "default"
                        }
                      >
                        {limit.count} requests
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(limit.resetAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetRateLimits(limit.key)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Violations */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Recent Violations (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.slice(0, 10).map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Zap className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm">
                      Rate limit exceeded for {violation.ipAddress}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(violation.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Rate Limit: {editingEndpoint}</DialogTitle>
            <DialogDescription>
              Configure rate limiting for this endpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>
            <div>
              <Label>Max Requests: {formData.maxRequests}</Label>
              <Slider
                value={[formData.maxRequests]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, maxRequests: value })
                }
                min={1}
                max={10000}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>10,000</span>
              </div>
            </div>
            <div>
              <Label>Window (seconds): {formData.windowSeconds}s</Label>
              <Slider
                value={[formData.windowSeconds]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, windowSeconds: value })
                }
                min={1}
                max={3600}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1s</span>
                <span>1h</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRateLimit} disabled={actionLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}