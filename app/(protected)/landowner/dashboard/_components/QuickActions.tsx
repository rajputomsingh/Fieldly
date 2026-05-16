"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

// Define action type for better type safety
interface Action {
  label: string;
  icon: LucideIcon;
  href: string;
  description?: string;
}

// Animation variants with proper Framer Motion typing
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    }
  },
};

const iconVariants: Variants = {
  hover: { 
    rotate: 8, 
    scale: 1.18,
    transition: { 
      type: "spring" as const,
      stiffness: 300,
      damping: 15,
    } 
  },
  tap: { 
    scale: 0.95,
    rotate: -2,
  },
};

// Action data - memoized to prevent recreation
const ACTIONS: Action[] = [
  { 
    label: "Add New Land", 
    icon: Plus, 
    href: "/landowner/land/new",
    description: "List your property"
  },
  { 
    label: "Applications", 
    icon: FileText, 
    href: "/applications",
    description: "Review requests"
  },
  { 
    label: "Leases", 
    icon: Users, 
    href: "/landowner/leases",
    description: "Manage agreements"
  },
  { 
    label: "Analytics", 
    icon: BarChart3, 
    href: "/landowner/analytics",
    description: "View insights"
  },
  { 
    label: "Settings", 
    icon: Settings, 
    href: "/landowner/settings",
    description: "Configure profile"
  },
  { 
    label: "Support", 
    icon: HelpCircle, 
    href: "/support",
    description: "Get help"
  },
];

// Individual action item component - memoized to prevent unnecessary re-renders
const QuickActionItem = memo(({ action }: { action: Action }) => {
  const Icon = action.icon;
  
  return (
    <motion.div
      variants={itemVariants}
      className="h-full"
    >
      <Button
        asChild
        variant="outline"
        className="
          relative h-auto w-full flex-col gap-2 p-4 rounded-xl
          text-foreground border-border/50 bg-card/50
          hover:border-primary/30 hover:bg-card
          shadow-sm hover:shadow-md
          transition-all duration-200 group
          overflow-hidden backdrop-blur-sm
        "
      >
        <Link 
          href={action.href}
          className="flex flex-col items-center gap-2 w-full"
          prefetch={false}
        >
          {/* Icon with hover animation */}
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={iconVariants}
            className="
              relative p-2.5 rounded-xl
              bg-primary/10 text-primary
              group-hover:bg-primary/20
              transition-colors duration-200
            "
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          {/* Label and description */}
          <div className="text-center space-y-0.5">
            <span className="text-xs font-semibold tracking-tight block">
              {action.label}
            </span>
            {action.description && (
              <span className="text-[10px] text-muted-foreground block">
                {action.description}
              </span>
            )}
          </div>

          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            initial={{ opacity: 0, x: "-100%" }}
            whileHover={{ 
              opacity: 1, 
              x: "100%",
              transition: { duration: 0.6, ease: "easeInOut" }
            }}
          />
        </Link>
      </Button>
    </motion.div>
  );
});

QuickActionItem.displayName = "QuickActionItem";

// Main component with optimizations
export const QuickActions = memo(function QuickActions() {
  // Memoize the actions list to prevent unnecessary re-renders
  const actionItems = useMemo(() => {
    return ACTIONS.map((action) => (
      <QuickActionItem key={action.label} action={action} />
    ));
  }, []);

  return (
    <Card className="border-border/40 shadow-sm backdrop-blur-sm bg-card/90">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span>Quick Actions</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({ACTIONS.length})
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
          role="navigation"
          aria-label="Quick actions"
        >
          {actionItems}
        </motion.div>
      </CardContent>
    </Card>
  );
});