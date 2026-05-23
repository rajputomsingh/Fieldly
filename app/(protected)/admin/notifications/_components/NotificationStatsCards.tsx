// app/(protected)/admin/notifications/_components/NotificationStatsCards.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NotificationStatsCardsProps {
  userCounts: {
    totalCount: number;
    farmerCount: number;
    landownerCount: number;
  };
}

export function NotificationStatsCards({ userCounts }: NotificationStatsCardsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: userCounts.totalCount,
      icon: "/onboarding/user-man-account-person.png",
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Farmers",
      value: userCounts.farmerCount,
      icon: "/ilsfarmer.png",
      gradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      title: "Landowners",
      value: userCounts.landownerCount,
      icon: "/landownersicon.png",
      gradient: "from-amber-500/10 to-orange-500/10",
    },
  ];

  if (isLoading) {
    return <NotificationStatsCardsSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid gap-4 sm:grid-cols-3"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1 + index * 0.08,
            duration: 0.4,
            ease: "easeOut",
          }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={cn(
              "relative rounded-2xl overflow-hidden",
              "bg-white/70 dark:bg-gray-900/70",
              "backdrop-blur-xl",
              "border border-gray-200/50 dark:border-gray-700/50",
              "shadow-sm hover:shadow-md",
              "transition-all duration-300",
              "group cursor-default"
            )}
          >
            <CardContent className="relative z-10 p-5">
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50
                    dark:from-gray-800 dark:to-gray-750
                    flex items-center justify-center
                    border border-gray-200/50 dark:border-gray-700/50
                    group-hover:scale-110 transition-transform duration-300"
                >
                  <Image
                    src={card.icon}
                    alt={card.title}
                    width={24}
                    height={24}
                    className="opacity-90"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function NotificationStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((_, index) => (
        <Card
          key={index}
          className="rounded-2xl overflow-hidden bg-white/70 dark:bg-gray-900/70
            backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-2 text-right">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}