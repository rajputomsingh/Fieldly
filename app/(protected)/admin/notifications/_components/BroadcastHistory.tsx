// app/(protected)/admin/notifications/_components/BroadcastHistory.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  Users,
  CalendarClock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface BroadcastRecord {
  id: string;
  metadata: {
    title?: string;
    targetType?: string;
    targetRole?: string;
    targetCount?: number;
    priority?: string;
    scheduledAt?: string;
    status?: string;
  };
  createdAt: string;
}

interface BroadcastHistoryProps {
  broadcasts: BroadcastRecord[];
  type: "sent" | "scheduled";
  onRefresh?: () => void; 
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function BroadcastHistory({
  broadcasts: initialBroadcasts,
  type,
}: BroadcastHistoryProps) {
  const [broadcasts, setBroadcasts] =
    useState<BroadcastRecord[]>(initialBroadcasts);
  const [refreshing, setRefreshing] = useState(false);

  // Sync when initialBroadcasts changes (from parent re-fetch)
  useEffect(() => {
    setBroadcasts(initialBroadcasts);
  }, [initialBroadcasts]);

  // Auto-refresh function
  const refreshBroadcasts = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/admin/notifications/broadcast?type=${type}`,
      );
      const data = await res.json();

      if (type === "sent") {
        const sent = (data.sent || []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          metadata: (a.metadata || {}) as BroadcastRecord["metadata"],
          createdAt: a.createdAt as string,
        }));
        setBroadcasts(sent);
      } else {
        const scheduled = (data.scheduled || []).map(
          (s: Record<string, unknown>) => ({
            id: s.id as string,
            metadata: {
              title: s.title as string,
              targetType: s.targetType as string,
              targetRole: s.targetRole as string | undefined,
              targetCount: 0,
              priority: s.priority as string,
              scheduledAt: s.scheduledAt as string,
              status: s.status as string,
            },
            createdAt: s.createdAt as string,
          }),
        );
        setBroadcasts(scheduled);
      }
    } catch {
      // Silently fail
    } finally {
      setRefreshing(false);
    }
  }, [type]);

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/broadcast?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Cancelled");
        // Remove from local state immediately
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        // Then refresh
        setTimeout(refreshBroadcasts, 500);
      }
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const isScheduled = type === "scheduled";

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {isScheduled ? (
              <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            {isScheduled ? "Scheduled" : "Sent"}
            <span className="text-sm font-normal text-muted-foreground">
              ({broadcasts.length})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={refreshBroadcasts}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {broadcasts.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            {isScheduled ? (
              <>
                <CalendarClock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No scheduled notifications</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
                  Use Compose tab to schedule
                </p>
              </>
            ) : (
              <>
                <History className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No sent notifications yet</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {broadcasts.map((broadcast) => {
              const metadata = broadcast.metadata;
              return (
                <div
                  key={broadcast.id}
                  className="flex items-start justify-between p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      {metadata?.title || "Untitled"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {metadata?.targetCount || 0}
                      </span>
                      {metadata?.targetRole && (
                        <span className="capitalize">
                          · {metadata.targetRole.toLowerCase()}s
                        </span>
                      )}
                      {isScheduled && metadata?.scheduledAt ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {new Date(metadata.scheduledAt).toLocaleString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      ) : (
                        <span>
                          {new Date(broadcast.createdAt).toLocaleString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isScheduled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => handleCancel(broadcast.id)}
                        title="Cancel"
                      >
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    {metadata?.priority && (
                      <Badge
                        className={`text-[10px] sm:text-xs ${priorityColors[metadata.priority] || ""}`}
                      >
                        {metadata.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
