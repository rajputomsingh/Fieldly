// app/(protected)/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Globe,
  Shield,
  Bell,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

// Type definitions
interface GeneralSettings {
  platformName: string;
  platformDescription: string;
  contactEmail: string;
  contactPhone: string;
}

interface SecuritySettings {
  require2FA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  ipWhitelistEnabled: boolean;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  adminAlerts: boolean;
}

interface PaymentSettings {
  platformFee: number;
  minimumPayout: number;
  autoPayout: boolean;
  payoutSchedule: string;
}

interface Settings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  payments: PaymentSettings;
}

type SettingsCategory = keyof Settings;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    general: {
      platformName: "Fieldly",
      platformDescription: "Connecting farmers and landowners",
      contactEmail: "support@fieldly.com",
      contactPhone: "",
    },
    security: {
      require2FA: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      ipWhitelistEnabled: true,
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      adminAlerts: true,
    },
    payments: {
      platformFee: 5,
      minimumPayout: 1000,
      autoPayout: true,
      payoutSchedule: "weekly",
    },
  });

  async function saveSettings(category: SettingsCategory) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: category,
          value: settings[category],
          category: category.toUpperCase(),
        }),
      });

      if (res.ok) {
        toast.success(`${category} settings saved successfully`);
      } else {
        toast.error(`Failed to save ${category} settings`);
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage platform configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.general.platformName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, platformName: e.target.value },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.general.platformDescription}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, platformDescription: e.target.value },
                  })}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, contactEmail: e.target.value },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.general.contactPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, contactPhone: e.target.value },
                    })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("general")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Require 2FA for Admin</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Two-factor authentication for admin accounts
                  </p>
                </div>
                <Switch
                  checked={settings.security.require2FA}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, require2FA: checked },
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">IP Whitelist</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Restrict admin access to specific IPs
                  </p>
                </div>
                <Switch
                  checked={settings.security.ipWhitelistEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, ipWhitelistEnabled: checked },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 60 },
                  })}
                />
                <p className="text-xs text-gray-500">
                  Automatically log out after inactivity (5-1440 minutes)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min={1}
                  max={10}
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) || 5 },
                  })}
                />
                <p className="text-xs text-gray-500">
                  Lock account after failed attempts (1-10 attempts)
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("security")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Send notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailEnabled: checked },
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Send real-time push notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.pushEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushEnabled: checked },
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">SMS Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Send notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.smsEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsEnabled: checked },
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Admin Alerts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Critical security and system alerts
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.adminAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, adminAlerts: checked },
                  })}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("notifications")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platformFee">Platform Fee (%)</Label>
                <Input
                  id="platformFee"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={settings.payments.platformFee}
                  onChange={(e) => setSettings({
                    ...settings,
                    payments: { ...settings.payments, platformFee: parseFloat(e.target.value) || 5 },
                  })}
                />
                <p className="text-xs text-gray-500">Percentage fee on each transaction</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumPayout">Minimum Payout (₹)</Label>
                <Input
                  id="minimumPayout"
                  type="number"
                  min={0}
                  step={100}
                  value={settings.payments.minimumPayout}
                  onChange={(e) => setSettings({
                    ...settings,
                    payments: { ...settings.payments, minimumPayout: parseInt(e.target.value) || 1000 },
                  })}
                />
                <p className="text-xs text-gray-500">Minimum amount for automatic payouts</p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Auto Payout</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically process payouts
                  </p>
                </div>
                <Switch
                  checked={settings.payments.autoPayout}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    payments: { ...settings.payments, autoPayout: checked },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                <Select
                  value={settings.payments.payoutSchedule}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    payments: { ...settings.payments, payoutSchedule: value },
                  })}
                >
                  <SelectTrigger id="payoutSchedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSettings("payments")} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}