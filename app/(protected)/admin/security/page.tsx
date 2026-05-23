// app/(protected)/admin/security/page.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AlertsPanel from "./_components/AlertsPanel";
import IPWhitelistPanel from "./_components/IPWhitelistPanel";
import RateLimitPanel from "./_components/RateLimitPanel";
import SessionsPanel from "./_components/SessionsPanel";
import SecurityOverview from "./_components/SecurityOverview";
import type { SecurityTab } from "./_types";

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<SecurityTab>("overview");

  return (
    <div className="space-y-6 p-6 mt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Security Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage security settings, alerts, and access controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SecurityTab)}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="ip-whitelist" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            IP Whitelist
          </TabsTrigger>
          <TabsTrigger value="rate-limit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SecurityOverview onNavigate={setActiveTab} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsPanel />
        </TabsContent>

        <TabsContent value="ip-whitelist">
          <IPWhitelistPanel />
        </TabsContent>

        <TabsContent value="rate-limit">
          <RateLimitPanel />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}