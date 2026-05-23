// app/(protected)/admin/security/_components/SecurityOverview.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  Globe,
  Gauge,
  Users,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecurityStats, SecurityAlert, AdminSession, SecurityTab } from "../_types";

interface SecurityOverviewProps {
  onNavigate: (tab: SecurityTab) => void;
}

export default function SecurityOverview({ onNavigate }: SecurityOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats>({
    activeAlerts: 0,
    whitelistedIPs: 0,
    activeSessions: 0,
    rateLimitViolations: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdminSession[]>([]);

  const fetchOverviewData = useCallback(async () => {
    try {
      const [alertsRes, ipRes, sessionsRes, rateLimitRes] = await Promise.all([
        fetch("/api/admin/security/alerts"),
        fetch("/api/admin/security/ip-whitelist?limit=1"),
        fetch("/api/admin/security/sessions?limit=5&status=active"),
        fetch("/api/admin/security/rate-limit"),
      ]);

      const [alertsData, ipData, sessionsData, rateLimitData] = await Promise.all([
        alertsRes.json(),
        ipRes.json(),
        sessionsRes.json(),
        rateLimitRes.json(),
      ]);

      setStats({
        activeAlerts: alertsData.alerts?.length || 0,
        whitelistedIPs: ipData.stats?.total || 0,
        activeSessions: sessionsData.stats?.active || 0,
        rateLimitViolations: rateLimitData.stats?.violations24h || 0,
      });

      setRecentAlerts(alertsData.alerts?.slice(0, 5) || []);
      setActiveSessions(sessionsData.sessions?.slice(0, 5) || []);
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchOverviewData]);

  const statCards = [
    {
      title: "Active Alerts",
      value: stats.activeAlerts,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
      tab: "alerts" as SecurityTab,
    },
    {
      title: "Whitelisted IPs",
      value: stats.whitelistedIPs,
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      tab: "ip-whitelist" as SecurityTab,
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      tab: "sessions" as SecurityTab,
    },
    {
      title: "Rate Limit Violations",
      value: stats.rateLimitViolations,
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      tab: "rate-limit" as SecurityTab,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-full mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => onNavigate(stat.tab)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Recent Alerts
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("alerts")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Badge
                      variant={
                        alert.severity === "CRITICAL" ? "destructive" : "default"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Active Sessions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("sessions")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {session.admin.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress} • {session.admin.role}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}