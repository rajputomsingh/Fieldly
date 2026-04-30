"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface StatsCardsData {
  total: number;
  active: number;
  pending: number;
  revenue: number;
}

interface StatsCardsProps {
  stats: StatsCardsData;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const cards = [
    {
      title: "Total Listings",
      value: stats.total,
      icon: "/onboarding/landreq.png",
    },
    {
      title: "Active",
      value: stats.active,
      icon: "/onboarding/user-man-account-person.png",
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: "/icons/quaterly.png",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: "/icons/pending.png",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-10 animate-pulse">
        {[1, 2, 3, 4].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10">
      {/* Glass Container */}
      <div
        className="relative p-6 rounded-[40px]
        bg-gradient-to-br from-white/60 to-gray-100/40
        dark:from-white/5 dark:to-white/10
        backdrop-blur-2xl
        border border-white/30 dark:border-white/10
        shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <Card
                className={cn(
                  "rounded-2xl",
                  "bg-white/60 dark:bg-white/5",
                  "backdrop-blur-xl",
                  "border border-white/30 dark:border-white/10",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
                  "transition-all duration-300",
                  "hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                )}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl
                      bg-gradient-to-br from-white/70 to-gray-200/40
                      dark:from-white/10 dark:to-white/5
                      flex items-center justify-center
                      border border-white/30 dark:border-white/10"
                    >
                      <Image
                        src={card.icon}
                        alt={card.title}
                        width={26}
                        height={26}
                        className="opacity-80"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.title}
                    </p>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                      {card.value}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
