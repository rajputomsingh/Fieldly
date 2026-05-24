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

const sidebarVariants: Variants = {
  expanded: {
    width: 248,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  collapsed: {
    width: 72,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const mobileDockVariants: Variants = {
  expanded: {
    width: 220,
    height: "auto",
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  collapsed: {
    width: 60,
    height: "auto",
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const overlayVariants: Variants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

const textVariants: Variants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  hidden: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const headerVariants: Variants = {
  visible: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  hidden: {
    opacity: 0,
    x: -10,
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = adminRole === "SUPER_ADMIN";
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const {
    onDockExpand,
    onDockCollapse,
    headerHeight: contextHeaderHeight,
  } = useAdminDock();

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateState = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        setHoverEnabled(false);
        setExpanded(false);
      } else {
        setHoverEnabled(true);
      }
    };

    updateState();
    window.addEventListener("resize", updateState);

    return () => {
      window.removeEventListener("resize", updateState);
    };
  }, []);

  useEffect(() => {
    if (expanded && !isMobile) {
      onDockExpand();
    } else {
      onDockCollapse();
    }
  }, [expanded, isMobile, onDockExpand, onDockCollapse]);

  const handleMouseEnter = useCallback(() => {
    if (hoverEnabled) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setExpanded(true);
    }
  }, [hoverEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (hoverEnabled) {
      hoverTimeoutRef.current = setTimeout(() => setExpanded(false), 150);
    }
  }, [hoverEnabled]);

  const handleMobileTap = useCallback(() => {
    if (isMobile) {
      setExpanded((prev) => !prev);
    }
  }, [isMobile]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const resolvedHeaderHeight =
    contextHeaderHeight > 0 ? contextHeaderHeight : 80;

  // Increased top margin
  const dockTop = isMobile
    ? resolvedHeaderHeight + 24
    : resolvedHeaderHeight + 32;

  const filteredNav = navigation.filter((item) => {
    if (
      (item.name === "Settings" || item.name === "Security") &&
      !isSuperAdmin
    ) {
      return false;
    }
    return true;
  });

  return (
    <>
      <AnimatePresence>
        {expanded && isMobile && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={isMobile ? mobileDockVariants : sidebarVariants}
        initial={false}
        animate={expanded ? "expanded" : "collapsed"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMobileTap}
        className={cn(
          "fixed z-50",
          isMobile ? "left-3" : "left-4",
          "flex flex-col",
          "rounded-[28px]",
          "overflow-hidden",
          "backdrop-blur-3xl backdrop-saturate-150",
          "border border-white/10 dark:border-white/5",
          "bg-gradient-to-b from-white/75 via-white/60 to-white/40",
          "dark:from-black/80 dark:via-neutral-950/70 dark:to-black/60",
          "shadow-[0_20px_80px_rgba(0,0,0,0.14),0_8px_32px_rgba(0,0,0,0.10),0_0_0_1px_rgba(255,255,255,0.05)_inset]",
          "dark:shadow-[0_20px_80px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.02)_inset]",
          "transition-shadow duration-500",
          "will-change-transform",
          isMobile ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
        )}
        style={{
          top: `${dockTop}px`,
          maxHeight: `calc(100vh - ${resolvedHeaderHeight}px - 80px)`,
        }}
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.05),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>

        {/* Header */}
        <AnimatePresence mode="wait">
          {expanded && (
            <motion.div
              variants={headerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative z-10 flex-shrink-0"
            >
              <div
                className={cn(
                  "flex items-center justify-between",
                  isMobile ? "px-3 pt-3 pb-2" : "px-5 pt-6 pb-4",
                )}
              >
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <h2
                    className={cn(
                      "font-semibold tracking-[0.18em] uppercase whitespace-nowrap text-black dark:text-white",
                      isMobile ? "text-[11px]" : "text-sm",
                    )}
                  >
                    Admin Panel
                  </h2>
                </motion.div>
              </div>

              <div
                className={cn(
                  "mx-4 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent",
                  isMobile && "mx-3",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav
          className={cn(
            "relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10",
            "hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20 overscroll-contain",
            isMobile ? "gap-0.5 px-2 pt-2 pb-6" : "gap-1.5 px-3 pt-3 pb-8",
          )}
        >
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className="outline-none focus-visible:ring-2 focus-visible:ring-[#b7cf8a] rounded-2xl"
              >
                <motion.div
                  whileHover={{ x: isMobile ? 1 : 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  className={cn(
                    "group relative flex items-center",
                    "rounded-2xl overflow-hidden transition-colors duration-300 cursor-pointer",
                    isMobile ? "h-[42px] px-3 gap-3" : "h-[50px] px-4",
                    isActive
                      ? cn(
                          "bg-black text-white",
                          "dark:bg-white dark:text-black",
                          isMobile
                            ? "shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                            : "shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
                          "dark:shadow-[0_10px_30px_rgba(255,255,255,0.1)]",
                        )
                      : cn(
                          "text-gray-600 dark:text-gray-400",
                          "hover:text-black dark:hover:text-white",
                          "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
                        ),
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent dark:from-black/5 rounded-2xl" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-black/[0.04] to-transparent dark:from-white/[0.06] rounded-2xl" />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center",
                      isMobile ? "min-w-[18px]" : "min-w-[22px]",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "transition-all duration-300",
                        isMobile ? "h-4 w-4" : "h-5 w-5",
                        isActive
                          ? "text-white dark:text-black"
                          : cn(
                              "text-gray-500 dark:text-gray-400",
                              "group-hover:scale-110",
                              "group-hover:text-black dark:group-hover:text-white",
                            ),
                      )}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {expanded && (
                      <motion.span
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={cn(
                          "font-medium whitespace-nowrap select-none",
                          isMobile ? "text-xs" : "text-sm ml-4",
                        )}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 dark:ring-black/10" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-white/15 dark:from-black/15 to-transparent" />
      </motion.aside>
    </>
  );
}
