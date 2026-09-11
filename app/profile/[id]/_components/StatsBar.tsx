// app/profile/[id]/_components/StatsBar.tsx

"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp, Star, Landmark, Clock, IndianRupeeIcon } from "lucide-react";
import { ProfileStats } from "@/types/profile";

interface Props {
  stats: ProfileStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  delay: number;
  subtext?: string;
}

function StatCard({ label, value, icon: Icon, trend, delay, subtext }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group flex flex-col items-center text-center gap-1.5 py-6 px-4"
    >
      {/* Value */}
      <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground group-hover:scale-105 transition-transform duration-300">
        {value}
      </p>
      
      {/* Label with icon */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      
      {/* Subtext */}
      {subtext && (
        <p className="text-[11px] text-muted-foreground/70">
          {subtext}
        </p>
      )}
      
      {/* Trend */}
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </motion.div>
  );
}

export function StatsBar({ stats }: Props) {
  const statsConfig = [
    { 
      label: "Total Listings", 
      value: stats.totalListings, 
      icon: Package, 
      trend: stats.listingsTrend,
      subtext: stats.activeListings !== undefined ? `${stats.activeListings} active` : undefined
    },
    { 
      label: "Active Leases", 
      value: stats.activeLeases, 
      icon: Landmark, 
      trend: stats.leasesTrend,
      subtext: stats.completedLeases ? `${stats.completedLeases} completed` : undefined
    },
    { 
      label: "Total Revenue", 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: IndianRupeeIcon, 
      trend: stats.revenueTrend,
      subtext: "Lifetime earnings"
    },
    { 
      label: "Rating", 
      value: stats.avgRating?.toFixed(1) ?? "New", 
      icon: Star,
      subtext: stats.totalReviews ? `${stats.totalReviews} reviews` : "No reviews yet"
    },
    { 
      label: "Response Rate", 
      value: stats.responseRate ? `${stats.responseRate}%` : "100%", 
      icon: Clock,
      trend: stats.responseTrend,
      subtext: "Avg. 2hr response"
    },
  ];

  return (
    <div className="w-full border-y border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y md:divide-y-0 divide-border/50">
          {statsConfig.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.05} />
          ))}
        </div>
      </div>
    </div>
  );
}
