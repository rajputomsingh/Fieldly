// app/(protected)/admin/_components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  FileText,
  CreditCard,
  AlertTriangle,
  BarChart,
  Settings,
  Shield,
  History,
  Menu,
  X,
  Bell,  
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdminSidebarProps {
  adminRole: string | null;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Listings", href: "/admin/listings", icon: Home },
  { name: "Applications", href: "/admin/applications", icon: FileText },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },  
  { name: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: History },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = adminRole === "SUPER_ADMIN";
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-md bg-white/70 backdrop-blur border shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay (Mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 transition-transform duration-300",
          "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-r border-white/20 dark:border-gray-800",
          "shadow-lg",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-gray-800 mt-6">
          <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200">
            Admin Panel
          </span>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname?.startsWith(item.href + "/");

            if (
              (item.name === "Settings" || item.name === "Security") &&
              !isSuperAdmin
            ) {
              return null;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "text-black dark:text-white"
                    : "text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                )}
              >
                {/* Active Indicator */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all",
                    isActive
                      ? "bg-[#b7cf8a]"
                      : "bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-700"
                  )}
                />

                {/* Icon */}
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive
                      ? "text-[#b7cf8a]"
                      : "text-gray-500 group-hover:text-black dark:group-hover:text-white"
                  )}
                />

                {/* Label */}
                <span>{item.name}</span>

                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-[#b7cf8a]/10 to-transparent" />
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}