// app/(protected)/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "./_components/StatsCard";
import { RecentActivity } from "./_components/RecentActivity";
import { SecurityAlert } from "./_components/SecurityAlert";
import {
  Users,
  Home,
  FileText,
  CreditCard,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#b7cf8a", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa"];

// Type definitions
interface AdminStats {
  users: { total: number; trend?: number };
  listings: { active: number; trend?: number };
  applications: { pending: number; trend?: number };
  payments: { total: number; trend?: number };
  disputes: { open: number; trend?: number };
}

interface AnalyticsData {
  userGrowth: Array<{ date: string; farmers: number; landowners: number; total: number }>;
  revenue: Array<{ month: string; revenue: number; platformFee: number }>;
  userDistribution: Array<{ name: string; value: number }>;
  listingStatus: Array<{ status: string; count: number; percentage: number }>;
  recentActivity: Array<{ id: string; type: string; user: string; action: string; timestamp: string }>;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState("last30days");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/analytics?range=${dateRange}`),
      ]);

      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();

      setStats(statsData);
      setAnalytics(analyticsData);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users?.total || 0,
      icon: Users,
      trend: stats?.users?.trend,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Active Listings",
      value: stats?.listings?.active || 0,
      icon: Home,
      trend: stats?.listings?.trend,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: "Applications",
      value: stats?.applications?.pending || 0,
      icon: FileText,
      trend: stats?.applications?.trend,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Total Revenue",
      value: `₹${((stats?.payments?.total || 0) / 100000).toFixed(1)}L`,
      icon: CreditCard,
      trend: stats?.payments?.trend,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Open Disputes",
      value: stats?.disputes?.open || 0,
      icon: AlertTriangle,
      trend: stats?.disputes?.trend,
      color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mt-12">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
          <Button variant="outline" size="icon" onClick={fetchDashboardData}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      <SecurityAlert />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <StatsCard key={stat.title} {...stat} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="farmers" stroke="#4ade80" name="Farmers" />
                  <Line type="monotone" dataKey="landowners" stroke="#60a5fa" name="Landowners" />
                  <Line type="monotone" dataKey="total" stroke="#b7cf8a" name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#b7cf8a" name="Revenue (₹)" />
                  <Bar dataKey="platformFee" fill="#fbbf24" name="Platform Fee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.userDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.userDistribution || []).map((_entry, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Listing Status */}
        <Card>
          <CardHeader>
            <CardTitle>Listing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics?.listingStatus || []).map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm">{item.status}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{item.count}</span>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#b7cf8a]"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={analytics?.recentActivity || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}