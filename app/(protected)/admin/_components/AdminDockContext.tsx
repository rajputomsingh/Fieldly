// app/(protected)/admin/_components/AdminDockContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AdminDockContextType {
  isDockExpanded: boolean;
  dockWidth: number;
  onDockExpand: () => void;
  onDockCollapse: () => void;
  isMobile: boolean;
  headerHeight: number;
}

const AdminDockContext = createContext<AdminDockContextType | undefined>(undefined);

export function AdminDockProvider({ children }: { children: ReactNode }) {
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    const updateState = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      const header = document.querySelector('header');
      if (header) {
        const height = header.getBoundingClientRect().height;
        setHeaderHeight(height);
      }
    };

    updateState();
    window.addEventListener('resize', updateState);
    window.addEventListener('scroll', updateState, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('scroll', updateState);
    };
  }, []);

  const dockWidth = isMobile 
    ? (isDockExpanded ? 220 : 60)
    : (isDockExpanded ? 248 : 72);

  const onDockExpand = useCallback(() => setIsDockExpanded(true), []);
  const onDockCollapse = useCallback(() => setIsDockExpanded(false), []);

  return (
    <AdminDockContext.Provider value={{ 
      isDockExpanded, 
      dockWidth, 
      onDockExpand, 
      onDockCollapse,
      isMobile,
      headerHeight
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