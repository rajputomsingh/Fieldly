// app/(protected)/admin/notifications/_components/AdminNotificationsClient.tsx
"use client";

import React, { useState, useCallback } from "react";
import { BroadcastForm } from "./BroadcastForm";
import { BroadcastHistory } from "./BroadcastHistory";
import { NotificationStatsCards } from "./NotificationStatsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, History, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BroadcastRecord {
  id: string;
  action: string;
  entity: string;
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

interface AdminNotificationsClientProps {
  adminRole: string;
  userCounts: {
    farmerCount: number;
    landownerCount: number;
    totalCount: number;
  };
  recentBroadcasts: BroadcastRecord[];
}

export function AdminNotificationsClient({
  userCounts,
  recentBroadcasts,
}: AdminNotificationsClientProps) {
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const [broadcasts, setBroadcasts] = useState(recentBroadcasts);
  const [processingScheduled, setProcessingScheduled] = useState(false);

  // Fetch updated broadcasts
  const refreshBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/broadcast");
      const data = await res.json();
      
      const sent = (data.sent || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        action: a.action as string,
        entity: a.entity as string,
        metadata: (a.metadata || {}) as BroadcastRecord['metadata'],
        createdAt: a.createdAt as string,
      }));

      const scheduled = (data.scheduled || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        action: 'SCHEDULED_NOTIFICATION',
        entity: 'NOTIFICATION',
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
      }));

      setBroadcasts([...scheduled, ...sent]);
    } catch {
      // Silently fail
    }
  }, []);

  // Auto-process scheduled notifications when switching to scheduled tab
  const processScheduled = useCallback(async () => {
    setProcessingScheduled(true);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success && data.sent > 0) {
        toast.success(`${data.sent} scheduled notifications sent`);
        // Refresh broadcasts instead of full page reload
        await refreshBroadcasts();
      }
    } catch {
      // Silently fail
    } finally {
      setProcessingScheduled(false);
    }
  }, [refreshBroadcasts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "scheduled") {
      processScheduled();
    } else {
      refreshBroadcasts();
    }
  };

  // Callback for BroadcastForm to refresh after sending
  const handleBroadcastSent = useCallback(() => {
    refreshBroadcasts();
  }, [refreshBroadcasts]);

  const sentBroadcasts = broadcasts.filter(
    (b) => !b.metadata?.status || b.metadata.status === "SENT",
  );
  const scheduledBroadcasts = broadcasts.filter(
    (b) => b.metadata?.status === "PENDING",
  );

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6 mt-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Notification Broadcast
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          Send targeted notifications to farmers and landowners
        </p>
      </div>

      <NotificationStatsCards userCounts={userCounts} />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted/40 p-1 border border-border/50">
          <TabsTrigger
            value="compose"
            className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border border border-transparent"
          >
            <Send className="h-4 w-4 shrink-0" />
            <span>Compose</span>
          </TabsTrigger>

          <TabsTrigger
            value="sent"
            className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border border border-transparent"
          >
            <History className="h-4 w-4 shrink-0" />
            <span>Sent</span>
            {sentBroadcasts.length > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 text-[10px] flex items-center justify-center">
                {sentBroadcasts.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="scheduled"
            className="flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border border border-transparent"
          >
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span>Scheduled</span>
            {scheduledBroadcasts.length > 0 && (
              <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px] flex items-center justify-center bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {scheduledBroadcasts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-3 sm:mt-4">
          <BroadcastForm 
            isSending={isSending} 
            setIsSending={setIsSending} 
            onSuccess={handleBroadcastSent}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-3 sm:mt-4">
          <BroadcastHistory 
            broadcasts={sentBroadcasts} 
            type="sent" 
            onRefresh={refreshBroadcasts}
          />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-3 sm:mt-4">
          {processingScheduled && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Processing scheduled notifications...
            </div>
          )}
          <BroadcastHistory 
            broadcasts={scheduledBroadcasts} 
            type="scheduled" 
            onRefresh={refreshBroadcasts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}