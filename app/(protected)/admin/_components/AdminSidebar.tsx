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
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAdminDock } from "./AdminDockContext";

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

// Animation variants with proper easing types
const sidebarVariants: Variants = {
  expanded: { 
    width: 248,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  },
  collapsed: { 
    width: 84,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  }
};

const mobileVariants: Variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  closed: {
    x: "-120%",
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

const overlayVariants: Variants = {
  open: { opacity: 1 },
  closed: { opacity: 0 }
};

const textVariants: Variants = {
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
  hidden: { 
    opacity: 0, 
    x: -8,
    transition: { duration: 0.15, ease: "easeIn" as const }
  }
};

const headerVariants: Variants = {
  visible: { 
    opacity: 1, 
    x: 0, 
    height: "auto",
    transition: { duration: 0.25, ease: "easeOut" as const }
  },
  hidden: { 
    opacity: 0, 
    x: -10, 
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" as const }
  }
};

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = adminRole === "SUPER_ADMIN";
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const { onDockExpand, onDockCollapse } = useAdminDock();
  
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setHoverEnabled(false);
        setExpanded(true);
      } else {
        setHoverEnabled(true);
        setExpanded(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify context about dock state changes
  useEffect(() => {
    if (expanded && !isMobile) {
      onDockExpand();
    } else {
      onDockCollapse();
    }
  }, [expanded, isMobile, onDockExpand, onDockCollapse]);

  // Lock body scroll on mobile
  useEffect(() => {
    if (open && isMobile) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open, isMobile]);

  // Close mobile sidebar when pathname changes (properly using useEffect)
  useEffect(() => {
    if (open && isMobile) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  // Handle hover with debounce for smoothness
  const handleMouseEnter = useCallback(() => {
    if (hoverEnabled && !isMobile) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setExpanded(true);
    }
  }, [hoverEnabled, isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (hoverEnabled && !isMobile) {
      hoverTimeoutRef.current = setTimeout(() => setExpanded(false), 100);
    }
  }, [hoverEnabled, isMobile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Touch handler for mobile
  const handleTouchStart = useCallback(() => {
    if (isMobile) {
      setExpanded(true);
    }
  }, [isMobile]);

  const sidebarContent = (
    <motion.aside
      variants={isMobile ? mobileVariants : sidebarVariants}
      initial={false}
      animate={
        isMobile 
          ? (open ? "open" : "closed")
          : (expanded ? "expanded" : "collapsed")
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className={cn(
        // Base positioning
        isMobile 
          ? "fixed top-0 left-0 h-full z-50" 
          : "fixed top-20 left-4 z-50 h-[620px] max-h-[calc(100vh-6rem)]",
        // Visual styling
        "flex flex-col",
        "rounded-[32px]",
        "overflow-hidden",
        "backdrop-blur-3xl backdrop-saturate-150",
        "border border-white/10 dark:border-white/5",
        // Premium glass gradient
        "bg-gradient-to-b from-white/75 via-white/60 to-white/40",
        "dark:from-black/80 dark:via-neutral-950/70 dark:to-black/60",
        // Premium shadow
        "shadow-[0_20px_80px_rgba(0,0,0,0.14),0_8px_32px_rgba(0,0,0,0.10),0_0_0_1px_rgba(255,255,255,0.05)_inset]",
        "dark:shadow-[0_20px_80px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.02)_inset]",
        "transition-shadow duration-500",
        // Mobile specific
        isMobile && "rounded-none w-[280px] max-h-full",
        // Smooth transitions
        "will-change-transform"
      )}
    >
      {/* Ambient Glow - Top */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.05),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.05),transparent_70%)]" />
      </div>

      {/* Header */}
      <AnimatePresence mode="wait">
        {(expanded || isMobile) && (
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative z-10 flex-shrink-0"
          >
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-sm font-semibold tracking-[0.18em] uppercase whitespace-nowrap text-black dark:text-white">
                  Admin Panel
                </h2>
              </motion.div>

              {/* Close button for mobile */}
              {isMobile && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-black dark:text-white" />
                </motion.button>
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 flex flex-col gap-1.5 px-3 pt-3 pb-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20 overscroll-contain">
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
              onClick={() => {
                if (isMobile) setOpen(false);
              }}
              className="outline-none focus-visible:ring-2 focus-visible:ring-[#b7cf8a] rounded-2xl"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                className={cn(
                  "group relative flex items-center",
                  "h-[50px] rounded-2xl px-4",
                  "overflow-hidden",
                  "transition-colors duration-300",
                  "cursor-pointer",

                  isActive
                    ? cn(
                        "bg-black text-white",
                        "dark:bg-white dark:text-black",
                        "shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
                        "dark:shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                      )
                    : cn(
                        "text-gray-600 dark:text-gray-400",
                        "hover:text-black dark:hover:text-white",
                        "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      )
                )}
              >
                {/* Active gradient overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent dark:from-black/5 rounded-2xl" />
                )}

                {/* Hover shimmer effect */}
                {!isActive && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-black/[0.04] to-transparent dark:from-white/[0.06] rounded-2xl" />
                )}

                {/* Icon container */}
                <div className="relative z-10 flex items-center justify-center min-w-[22px]">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive
                        ? "text-white dark:text-black"
                        : cn(
                            "text-gray-500 dark:text-gray-400",
                            "group-hover:scale-110",
                            "group-hover:text-black dark:group-hover:text-white"
                          )
                    )}
                  />
                </div>

                {/* Label with smooth animation */}
                <AnimatePresence mode="wait">
                  {(expanded || isMobile) && (
                    <motion.span
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className={cn(
                        "ml-4 text-sm font-medium whitespace-nowrap",
                        "select-none"
                      )}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active indicator ring */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 dark:ring-black/10" />
                )}

                {/* Active dot for collapsed state */}
                {isActive && !expanded && !isMobile && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#b7cf8a] shadow-[0_0_6px_rgba(183,207,138,0.8)]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-white/15 dark:from-black/15 to-transparent" />
    </motion.aside>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed top-4 left-4 z-[60]",
            "w-11 h-11 rounded-2xl",
            "bg-white/80 dark:bg-black/70",
            "backdrop-blur-2xl",
            "border border-white/20 dark:border-white/10",
            "shadow-[0_10px_40px_rgba(0,0,0,0.12)]",
            "flex items-center justify-center",
            "transition-all duration-300",
            open && "opacity-0 pointer-events-none"
          )}
        >
          <Menu className="h-5 w-5 text-black dark:text-white mt-12" />
        </motion.button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {sidebarContent}
    </>
  );
}