// app/(protected)/admin/_components/AdminMainContent.tsx
"use client";

import { useAdminDock } from "./AdminDockContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AdminMainContent({ children }: { children: ReactNode }) {
  const { isDockExpanded, isMobile } = useAdminDock();

  return (
    <main
      className={cn(
        "transition-all duration-400 ease-in-out",
        !isMobile && "ml-[100px]", // Base margin for collapsed dock (84px + 16px gap)
        !isMobile && isDockExpanded && "ml-[264px]", // Expanded dock margin (248px + 16px gap)
        isMobile && "ml-0", // No margin on mobile
        "pt-20 lg:pt-6", // Extra top padding on mobile for the hamburger button
        "px-4 lg:px-6",
        "min-h-screen"
      )}
      style={{
        transition: "margin-left 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)"
      }}
    >
      {children}
    </main>
  );
}