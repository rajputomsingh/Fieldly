// app/(protected)/admin/users/_components/UserStatsCards.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserStats } from "../_types";

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats.total,
      icon: "/onboarding/user-man-account-person.png",
    },
    {
      title: "Farmers",
      value: stats.byRole?.FARMER || 0,
      icon: "/ilsfarmer.png",
    },
    {
      title: "Landowners",
      value: stats.byRole?.LANDOWNER || 0,
      icon: "/landownersicon.png",
    },
    {
      title: "Admins",
      value: (stats.byRole?.ADMIN || 0) + (stats.byRole?.SUPER_ADMIN || 0),
      icon: "/onboarding/review.png",
    },
  ];

  if (isLoading) {
    return <UserStatsCardsSkeleton />;
  }

  return (
    <div className="mt-10">
      {/* Premium Container */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-[40px]
            bg-white/75 dark:bg-neutral-950/75
            border border-gray-100 dark:border-neutral-800
            backdrop-blur-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]"
        />

        <div className="relative z-10 px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.08 + index * 0.07,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className={cn(
                    "relative rounded-3xl overflow-hidden",
                    "bg-white dark:bg-neutral-900",
                    "border border-gray-100 dark:border-neutral-800",
                    "shadow-[0_20px_60px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.03)]",
                    "hover:shadow-[0_28px_80px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.05)]",
                    "transition-all duration-500",
                    "group cursor-default"
                  )}
                >
                  <CardContent className="relative z-10 p-6 space-y-5">
                    {/* Icon */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-14 h-14 rounded-2xl
                          bg-gray-50 dark:bg-neutral-800
                          border border-gray-100 dark:border-neutral-700
                          flex items-center justify-center
                          shadow-sm
                          group-hover:scale-105
                          transition-all duration-300"
                      >
                        <Image
                          src={card.icon}
                          alt={card.title}
                          width={28}
                          height={28}
                          className="opacity-90 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <p
                        className="text-[11px] font-semibold
                        uppercase tracking-[0.14em]
                        text-gray-400 dark:text-gray-500
                        mb-2"
                      >
                        {card.title}
                      </p>

                      <motion.h3
                        className="text-3xl font-bold tracking-tight
                          text-gray-900 dark:text-white"
                      >
                        {typeof card.value === "number"
                          ? card.value.toLocaleString()
                          : card.value}
                      </motion.h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

function UserStatsCardsSkeleton() {
  return (
    <div className="mt-10">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-[40px]
            bg-white/75 dark:bg-neutral-950/75
            border border-gray-100 dark:border-neutral-800
            backdrop-blur-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]"
        />

        <div className="relative z-10 px-6 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((_, index) => (
              <Card
                key={index}
                className="rounded-3xl overflow-hidden
                  bg-white dark:bg-neutral-900
                  border border-gray-100 dark:border-neutral-800
                  shadow-[0_20px_60px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.03)]"
              >
                <CardContent className="p-6 space-y-5">
                  {/* Icon skeleton */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-14 h-14 rounded-2xl
                        bg-gray-100 dark:bg-neutral-800
                        animate-pulse"
                    />
                  </div>

                  {/* Text skeleton */}
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded-md bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                    <div className="h-8 w-24 rounded-md bg-gray-100 dark:bg-neutral-800 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}