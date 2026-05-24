// app/(protected)/admin/security/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldAlert, GlobeLock, Gauge, MonitorSmartphone, ChevronRight } from "lucide-react";
import AlertsPanel from "./_components/AlertsPanel";
import IPWhitelistPanel from "./_components/IPWhitelistPanel";
import RateLimitPanel from "./_components/RateLimitPanel";
import SessionsPanel from "./_components/SessionsPanel";
import SecurityOverview from "./_components/SecurityOverview";
import type { SecurityTab } from "./_types";

const tabs = [
  { value: "overview", label: "Overview", icon: Shield },
  { value: "alerts", label: "Alerts", icon: ShieldAlert },
  { value: "ip-whitelist", label: "IP Whitelist", icon: GlobeLock },
  { value: "rate-limit", label: "Rate Limits", icon: Gauge },
  { value: "sessions", label: "Sessions", icon: MonitorSmartphone },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<SecurityTab>("overview");

  return (
    <div className="relative min-h-screen w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-10 pb-12">
      {/* Ambient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 h-[420px] w-[420px] rounded-full bg-black/[0.03] blur-3xl dark:bg-white/[0.03]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-black/[0.02] blur-3xl dark:bg-white/[0.02]" />
      </div>

      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6"
        >
          {/* Left */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 dark:border-white/5 bg-white/50 dark:bg-black/30 backdrop-blur-2xl px-4 py-1.5">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium tracking-wide">SECURITY CENTER</span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">Security Management</h1>
              <p className="mt-2 text-sm lg:text-base text-muted-foreground max-w-2xl">
                Monitor security posture, manage access controls, configure rate limiting, and analyze suspicious activities across the platform.
              </p>
            </div>
          </div>

          {/* Right Bento Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 w-full xl:w-auto"
          >
            <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-white/70 via-white/50 to-white/30 dark:from-black/60 dark:via-neutral-950/50 dark:to-black/40 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.06)] p-4 min-w-[140px]">
              <p className="text-xs text-muted-foreground">Threat Score</p>
              <h3 className="text-3xl font-bold mt-2">98%</h3>
            </div>

            <div className="rounded-3xl bg-black text-white dark:bg-white dark:text-black shadow-[0_20px_80px_rgba(0,0,0,0.10)] p-4 min-w-[140px]">
              <p className="text-xs opacity-70">Active Sessions</p>
              <h3 className="text-3xl font-bold mt-2">24</h3>
            </div>

            <div className="rounded-3xl border border-white/10 dark:border-white/5 bg-gradient-to-b from-white/70 via-white/50 to-white/30 dark:from-black/60 dark:via-neutral-950/50 dark:to-black/40 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.06)] p-4 min-w-[140px]">
              <p className="text-xs text-muted-foreground">Alerts Today</p>
              <h3 className="text-3xl font-bold mt-2">7</h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SecurityTab)} className="space-y-6">
          {/* Tabs Nav */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 h-auto rounded-[30px] border border-white/10 dark:border-white/5 bg-gradient-to-b from-white/70 via-white/50 to-white/30 dark:from-black/60 dark:via-neutral-950/50 dark:to-black/40 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.06)] p-2 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="security-active-pill"
                        className="absolute inset-0 rounded-2xl border border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="rounded-[34px] border border-white/10 dark:border-white/5 bg-gradient-to-b from-white/70 via-white/50 to-white/30 dark:from-black/60 dark:via-neutral-950/50 dark:to-black/40 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.06)] p-5 lg:p-7">
                <TabsContent value="overview" className="mt-0">
                  <SecurityOverview onNavigate={setActiveTab} />
                </TabsContent>

                <TabsContent value="alerts" className="mt-0">
                  <AlertsPanel />
                </TabsContent>

                <TabsContent value="ip-whitelist" className="mt-0">
                  <IPWhitelistPanel />
                </TabsContent>

                <TabsContent value="rate-limit" className="mt-0">
                  <RateLimitPanel />
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  <SessionsPanel />
                </TabsContent>
              </div>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-[32px] border border-white/10 dark:border-white/5 bg-black text-white dark:bg-white dark:text-black shadow-[0_20px_80px_rgba(0,0,0,0.10)] p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
        >
          <div>
            <h3 className="text-xl font-semibold">Security posture is stable</h3>
            <p className="mt-1 text-sm opacity-70">All systems are operating normally with active protections enabled.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 dark:bg-black/10 dark:hover:bg-black/15 px-5 py-3 text-sm font-medium transition-all duration-300">
            View Detailed Logs
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}