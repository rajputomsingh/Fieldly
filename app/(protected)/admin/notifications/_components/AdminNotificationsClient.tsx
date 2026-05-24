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
        metadata: (a.metadata || {}) as BroadcastRecord["metadata"],
        createdAt: a.createdAt as string,
      }));

      const scheduled = (data.scheduled || []).map(
        (s: Record<string, unknown>) => ({
          id: s.id as string,
          action: "SCHEDULED_NOTIFICATION",
          entity: "NOTIFICATION",
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

      setBroadcasts([...scheduled, ...sent]);
    } catch {
      // Silently fail
    }
  }, []);

  // Auto-process scheduled notifications
  const processScheduled = useCallback(async () => {
    setProcessingScheduled(true);

    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success && data.sent > 0) {
        toast.success(`${data.sent} scheduled notifications sent`);
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
    <div
      className="
    relative
    w-full
    min-h-screen

    px-4 sm:px-6 lg:px-8 xl:px-10
    pt-10 pb-10

    transition-all duration-300
  "
    >
      {" "}
      <div
        className="
          max-w-[1800px]
          2xl:px-8
          mx-auto
          space-y-6
        "
      >
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Notification Broadcast
          </h1>

          <p className="text-sm text-muted-foreground">
            Send targeted notifications to farmers and landowners
          </p>
        </div>

        {/* Stats */}
        <NotificationStatsCards userCounts={userCounts} />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="
            w-full
            grid grid-cols-1
            gap-6
          "
        >
          {/* Tabs Nav */}
          <TabsList
            className="
              grid w-full grid-cols-3
              h-14 rounded-2xl
              bg-white/50 dark:bg-black/30
              border border-white/10 dark:border-white/5
              backdrop-blur-2xl
              shadow-[0_10px_40px_rgba(0,0,0,0.04)]
              p-1
            "
          >
            <TabsTrigger
              value="compose"
              className="
                flex items-center justify-center gap-2
                rounded-xl
                text-sm font-medium
                transition-all duration-300
                data-[state=active]:bg-black
                data-[state=active]:text-white
                dark:data-[state=active]:bg-white
                dark:data-[state=active]:text-black
              "
            >
              <Send className="h-4 w-4 shrink-0" />
              <span>Compose</span>
            </TabsTrigger>

            <TabsTrigger
              value="sent"
              className="
                flex items-center justify-center gap-2
                rounded-xl
                text-sm font-medium
                transition-all duration-300
                data-[state=active]:bg-black
                data-[state=active]:text-white
                dark:data-[state=active]:bg-white
                dark:data-[state=active]:text-black
              "
            >
              <History className="h-4 w-4 shrink-0" />

              <span>Sent</span>

              {sentBroadcasts.length > 0 && (
                <Badge
                  variant="secondary"
                  className="
                    h-5 min-w-5 rounded-full
                    px-1.5 text-[10px]
                    flex items-center justify-center
                  "
                >
                  {sentBroadcasts.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="scheduled"
              className="
                flex items-center justify-center gap-2
                rounded-xl
                text-sm font-medium

                transition-all duration-300

                data-[state=active]:bg-black
                data-[state=active]:text-white

                dark:data-[state=active]:bg-white
                dark:data-[state=active]:text-black
              "
            >
              <CalendarClock className="h-4 w-4 shrink-0" />

              <span>Scheduled</span>

              {scheduledBroadcasts.length > 0 && (
                <Badge
                  className="
                    h-5 min-w-5 rounded-full
                    px-1.5 text-[10px]
                    flex items-center justify-center

                    bg-yellow-100 text-yellow-700
                    dark:bg-yellow-900/30 dark:text-yellow-400
                  "
                >
                  {scheduledBroadcasts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Compose */}
          <TabsContent
            value="compose"
            className="
              mt-4
              grid grid-cols-1
              xl:grid-cols-[1.2fr_0.8fr]
              gap-6
              items-start
            "
          >
            {/* Compose Card */}
            <div
              className="
                rounded-[32px]
                border border-white/10 dark:border-white/5

                bg-gradient-to-b
                from-white/70
                via-white/50
                to-white/30
                dark:from-black/60
                dark:via-neutral-950/50
                dark:to-black/40
                backdrop-blur-3xl
                shadow-[0_20px_80px_rgba(0,0,0,0.08)]

                p-5 lg:p-7
              "
            >
              <BroadcastForm
                isSending={isSending}
                setIsSending={setIsSending}
                onSuccess={handleBroadcastSent}
              />
            </div>

            {/* Overview Bento */}
            <div
              className="
                rounded-[32px]
                border border-white/10 dark:border-white/5

                bg-gradient-to-b
                from-white/60
                via-white/40
                to-white/20

                dark:from-black/50
                dark:via-neutral-950/40
                dark:to-black/30

                backdrop-blur-3xl

                shadow-[0_20px_80px_rgba(0,0,0,0.06)]

                p-5 lg:p-6

                sticky top-10
              "
            >
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide">
                    Broadcast Overview
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time notification distribution status
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black text-white dark:bg-white dark:text-black p-4">
                    <p className="text-xs opacity-70">Sent</p>

                    <h4 className="text-2xl font-bold mt-1">
                      {sentBroadcasts.length}
                    </h4>
                  </div>

                  <div className="rounded-2xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground">Scheduled</p>

                    <h4 className="text-2xl font-bold mt-1">
                      {scheduledBroadcasts.length}
                    </h4>
                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    border border-border/50
                    p-4
                    bg-background/40
                  "
                >
                  <p className="text-xs text-muted-foreground">Total Reach</p>

                  <h4 className="text-3xl font-bold mt-2">
                    {userCounts.totalCount}
                  </h4>

                  <p className="text-xs text-muted-foreground mt-1">
                    onboarded users
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground">Farmers</p>

                    <h4 className="text-2xl font-bold mt-1">
                      {userCounts.farmerCount}
                    </h4>
                  </div>

                  <div className="rounded-2xl border border-border/50 p-4">
                    <p className="text-xs text-muted-foreground">Landowners</p>

                    <h4 className="text-2xl font-bold mt-1">
                      {userCounts.landownerCount}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sent */}
          <TabsContent value="sent" className="mt-4">
            <div
              className="
                rounded-[32px]
                border border-white/10 dark:border-white/5

                bg-gradient-to-b
                from-white/70
                via-white/50
                to-white/30

                dark:from-black/60
                dark:via-neutral-950/50
                dark:to-black/40

                backdrop-blur-3xl

                shadow-[0_20px_80px_rgba(0,0,0,0.08)]

                p-5 lg:p-7
              "
            >
              <BroadcastHistory
                broadcasts={sentBroadcasts}
                type="sent"
                onRefresh={refreshBroadcasts}
              />
            </div>
          </TabsContent>

          {/* Scheduled */}
          <TabsContent value="scheduled" className="mt-4">
            <div
              className="
                rounded-[32px]
                border border-white/10 dark:border-white/5

                bg-gradient-to-b
                from-white/70
                via-white/50
                to-white/30

                dark:from-black/60
                dark:via-neutral-950/50
                dark:to-black/40

                backdrop-blur-3xl

                shadow-[0_20px_80px_rgba(0,0,0,0.08)]

                p-5 lg:p-7
              "
            >
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
