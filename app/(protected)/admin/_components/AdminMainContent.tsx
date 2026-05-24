// app/(protected)/admin/_components/AdminMainContent.tsx
"use client";

import { useAdminDock } from "./AdminDockContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AdminMainContent({ children }: { children: ReactNode }) {
  const { isDockExpanded, isMobile, headerHeight } = useAdminDock();
  
  const resolvedHeaderHeight = headerHeight > 0 ? headerHeight : 80;

  return (
    <main
      className={cn(
        "transition-all duration-400 ease-in-out",
        // Left margin for dock (desktop)
        !isMobile && "ml-[88px]",
        !isMobile && isDockExpanded && "ml-[264px]",
        // Left margin for dock (mobile)
        isMobile && !isDockExpanded && "ml-[72px]",
        isMobile && isDockExpanded && "ml-[236px]",
        // Common styles
        "px-4 lg:px-6",
        "min-h-screen"
      )}
      style={{
        paddingTop: `${resolvedHeaderHeight + 16}px`,
        transition: "margin-left 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), padding-top 0.3s ease-out"
      }}
    >
      {children}
    </main>
  );
}