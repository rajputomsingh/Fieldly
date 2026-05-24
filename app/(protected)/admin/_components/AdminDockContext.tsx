// app/(protected)/admin/_components/AdminDockContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AdminDockContextType {
  isDockExpanded: boolean;
  dockWidth: number;
  onDockExpand: () => void;
  onDockCollapse: () => void;
  isMobile: boolean;
}

const AdminDockContext = createContext<AdminDockContextType | undefined>(undefined);

export function AdminDockProvider({ children }: { children: ReactNode }) {
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  // Fix: Provide initial value for useState
  const [isMobile, setIsMobile] = useState(false);

  // Update mobile state on mount and resize
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Set initial value
    updateMobileState();
    
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

  const dockWidth = isMobile ? 0 : (isDockExpanded ? 248 : 84);

  const onDockExpand = useCallback(() => {
    if (!isMobile) setIsDockExpanded(true);
  }, [isMobile]);

  const onDockCollapse = useCallback(() => {
    if (!isMobile) setIsDockExpanded(false);
  }, [isMobile]);

  return (
    <AdminDockContext.Provider value={{ 
      isDockExpanded, 
      dockWidth, 
      onDockExpand, 
      onDockCollapse,
      isMobile 
    }}>
      {children}
    </AdminDockContext.Provider>
  );
}

export function useAdminDock() {
  const context = useContext(AdminDockContext);
  if (!context) {
    throw new Error("useAdminDock must be used within AdminDockProvider");
  }
  return context;
}