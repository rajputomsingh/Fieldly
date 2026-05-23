// app/(protected)/admin/notifications/_components/BroadcastHistory.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Users, Clock } from 'lucide-react';

interface BroadcastRecord {
  id: string;
  metadata: {
    title?: string;
    targetType?: string;
    targetRole?: string;
    targetCount?: number;
    priority?: string;
  };
  createdAt: string;
}

interface BroadcastHistoryProps {
  broadcasts: BroadcastRecord[];
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export function BroadcastHistory({ broadcasts }: BroadcastHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Broadcast History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {broadcasts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No broadcasts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => {
              const metadata = broadcast.metadata;
              return (
                <div
                  key={broadcast.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{metadata?.title || 'Untitled'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {metadata?.targetCount || 0} users
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(broadcast.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <Badge className={priorityColors[metadata?.priority || 'MEDIUM'] || ''}>
                    {metadata?.priority || 'MEDIUM'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}