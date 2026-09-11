// app/profile/[id]/_components/ListingsGrid.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Gavel,
  TrendingUp,
  Clock,
  ChevronRight,
  Package,
  ArrowUpDown,
  IndianRupee,
  Flame,
  Timer,
} from "lucide-react";
import { ProfileListing } from "@/types/profile";
import { useState, useMemo } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  listings: ProfileListing[];
}

type SortOption =
  | "latest"
  | "price_asc"
  | "price_desc"
  | "most_bids"
  | "ending_soon";

export function ListingsGrid({ listings }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  // Stable "now" to prevent hydration mismatch
  const now = useMemo(() => new Date(), []);

  // Sorting
  const sortedListings = useMemo(() => {
    const sorted = [...listings];

    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => a.basePrice - b.basePrice);
      case "price_desc":
        return sorted.sort((a, b) => b.basePrice - a.basePrice);
      case "most_bids":
        return sorted.sort((a, b) => b.totalBids - a.totalBids);
      case "ending_soon":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.endDate).getTime();
          const dateB = new Date(b.endDate).getTime();
          return dateA - dateB;
        });
      case "latest":
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
    }
  }, [listings, sortBy]);

  // Hydration-safe time calc
  const getTimeRemaining = (endDate: Date | string) => {
    const end = new Date(endDate).getTime();
    const diff = end - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  const sortOptions = [
    {
      value: "latest",
      label: "Latest",
      icon: ChevronRight,
    },
    {
      value: "price_asc",
      label: "Price: Low to High",
      icon: ArrowUpDown,
    },
    {
      value: "price_desc",
      label: "Price: High to Low",
      icon: IndianRupee,
    },
    {
      value: "most_bids",
      label: "Most Bids",
      icon: Flame,
    },
    {
      value: "ending_soon",
      label: "Ending Soon",
      icon: Timer,
    },
  ];

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Active Listings
              </h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              {listings.length === 0
                ? "No listings available at the moment"
                : `${listings.length} ${listings.length === 1 ? "listing" : "listings"} waiting for bids`}
            </p>
          </div>
        </div>

        {/* Clean Sort Buttons */}
        {listings.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.value;

              return (
                <motion.button
                  key={option.value}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={cn(
                    "group relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border hover:bg-accent/50 hover:border-primary/20",
                  )}
                >
                  <div className="relative flex items-center gap-2">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-primary",
                        !isActive && "group-hover:scale-110",
                      )}
                    />
                    <span>{option.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {listings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 rounded-2xl border-2 border-dashed bg-muted/20"
          >
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium text-lg">
              No active listings yet
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Listings will appear here once published
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
          >
            {sortedListings.map((listing) => (
              <motion.div
                key={listing.id}
                variants={itemVariants}
                layout
                onHoverStart={() => setHoveredId(listing.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                <Link href={`/marketplace/listings/${listing.id}`}>
                  <div className="group relative rounded-2xl border bg-card overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Image */}
                    <div className="relative h-56 md:h-64 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                      {listing.images?.[0]?.url ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          unoptimized={process.env.NODE_ENV === "development"}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-muted-foreground/20" />
                        </div> 
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {listing.isUrgent && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-red-500 text-white rounded-full shadow-lg flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Urgent
                          </span>
                        )}
                        {(listing.hotnessScore ?? 0) > 70 && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full shadow-lg flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Hot Deal
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 text-xs font-medium bg-black/60 backdrop-blur-md text-white rounded-full flex items-center gap-1 shadow-lg">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(listing.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 md:p-6 space-y-3">
                      <h3 className="font-semibold text-lg md:text-xl line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {listing.land?.village ?? "Location not specified"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Gavel className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {listing.totalBids}{" "}
                            {listing.totalBids === 1 ? "bid" : "bids"}
                          </span>
                        </div>
                      </div>

                      {listing.land?.size && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium">
                            {listing.land.size} acres
                          </span>
                          <span className="text-border">•</span>
                          <span className="capitalize">
                            {listing.land.landType?.toLowerCase()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Base Price
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-primary">
                            {formatINR(listing.basePrice)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              /year
                            </span>
                          </p>
                        </div>

                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{
                            x: hoveredId === listing.id ? 0 : -10,
                            opacity: hoveredId === listing.id ? 1 : 0,
                          }}
                          className="bg-primary/10 rounded-full p-2"
                        >
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </motion.div>
                      </div>

                      {/* Progress */}
                      {listing.maxBids && listing.totalBids > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  (listing.totalBids / listing.maxBids) * 100,
                                  100,
                                )}%`,
                              }}
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 flex justify-between">
                            <span>{listing.totalBids} bids placed</span>
                            <span>Target: {listing.maxBids} bids</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ListingsGrid;