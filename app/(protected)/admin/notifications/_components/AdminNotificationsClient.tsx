// app/(protected)/admin/notifications/_components/AdminNotificationsClient.tsx
'use client';

import React, { useState } from 'react';
import { BroadcastForm } from './BroadcastForm';
import { BroadcastHistory } from './BroadcastHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, History } from 'lucide-react';

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 mt-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Broadcast</h1>
        <p className="text-muted-foreground mt-1">
          Send targeted notifications to farmers and landowners
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts.totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts.farmerCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Landowners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts.landownerCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="broadcast" className="w-full">
        <TabsList>
          <TabsTrigger value="broadcast" className="gap-2">
            <Send className="h-4 w-4" />
            New Broadcast
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="broadcast" className="mt-4">
          <BroadcastForm isSending={isSending} setIsSending={setIsSending} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <BroadcastHistory broadcasts={recentBroadcasts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}