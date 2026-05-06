// app/(marketplace)/_components/ListingDetail.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SavedButton } from "./SavedButton";
import { VerifiedBadge } from "./VerifiedBadge";
import { useUser } from "@clerk/nextjs";
import {
  MapPin,
  Share2,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileText,
  Droplets,
  Zap as ZapIcon,
  Truck,
  Lock,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Ruler,
  Leaf,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Heart,
  Eye,
  Ban,
  Hourglass,
} from "lucide-react";
import { formatCurrency, formatTimeLeft, getInitials, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// ============= TYPES =============
interface SoilReport {
  id: string;
  ph: number | null;
  moisture: number | null;
  nutrients: string | null;
  reportUrl: string | null;
  testedBy: string | null;
  testedAt: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string | null;
  size: number | null;
  createdAt: string | null;
}

interface LandImage {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
}

interface ListingImage {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Bid {
  id: string;
  amount: number;
  farmerId: string;
  createdAt: string;
  isAutoBid: boolean;
  farmer?: { id: string; name: string; imageUrl: string | null };
}

interface Analytics {
  listingId: string;
  demandScore: number | null;
  bidVelocity: number | null;
  conversionScore: number | null;
  avgBidGap: number | null;
  watchers: number;
  lastActivityAt: string | null;
}

interface LandWithGeo {
  id: string;
  size: number;
  landType: string;
  district: string | null;
  state: string | null;
  soilType: string | null;
  irrigationAvailable: boolean;
  electricityAvailable: boolean | null;
  roadAccess: boolean | null;
  fencingAvailable: boolean | null;
  waterSource: string | null;
  latitude?: number | null;
  longitude?: number | null;
  village?: string | null;
  pincode?: string | null;
  address?: string | null;
  location?: string | null;
  images?: LandImage[];
  documents?: Document[];
  soilReports?: SoilReport[];
}

export interface ListingDetailProps {
  listing: {
    id: string;
    title: string;
    description: string | null;
    basePrice: number;
    highestBid: number | null;
    endDate: string;
    startDate: string;
    minimumLeaseDuration: number;
    maximumLeaseDuration: number;
    status: string;
    listingType: string;
    auctionStatus?: string;
    land: LandWithGeo;
    owner: {
      id: string;
      name: string;
      imageUrl: string | null;
      createdAt: string;
      updatedAt: string;
      landownerProfile?: {
        isVerified: boolean;
        verificationLevel: number;
      } | null;
    };
    images?: ListingImage[];
    bids?: Bid[];
    analytics?: Analytics | null;
    _count?: { bids: number; savedBy: number; applications: number };
  };
}

// ============= DETAILS TAB PROPS =============
interface DetailsTabProps {
  land: LandWithGeo;
  fullAddress: string;
  formattedLocation: string;
}

interface InfoBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  color?: "primary" | "secondary";
  className?: string;
  iconClassName?: string;
}

interface MapButtonsProps {
  onDirections: () => void;
  onMap: () => void;
}

// ============= ANIMATION VARIANTS =============
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

const imageVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 500 : -500,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  }),
};

const tabContentVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const hoverScale = { scale: 1.02 };
const tapScale = { scale: 0.98 };
const hoverGlow = { scale: 1.05, boxShadow: "0 0 20px rgba(0,0,0,0.1)" };

// ============= REUSABLE COMPONENTS =============
const InfoBadge = ({
  icon: Icon,
  label,
  value,
  color = "primary",
  className,
  iconClassName,
}: InfoBadgeProps) => (
  <div
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-muted/30",
      className,
    )}
  >
    <Icon
      className={cn(
        "h-5 w-5",
        color === "primary" && "text-primary",
        iconClassName,
      )}
    />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

const MapButtons = ({ onDirections, onMap }: MapButtonsProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-3 mb-4"
  >
    <button
      onClick={onDirections}
      className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 shadow-inner">
        <Navigation className="h-4 w-4 text-gray-700" />
      </span>
      <span className="text-sm font-medium text-gray-800">Directions</span>
    </button>
    <button
      onClick={onMap}
      className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 shadow-inner">
        <MapPin className="h-4 w-4 text-gray-700" />
      </span>
      <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
        View on Map
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </span>
    </button>
  </motion.div>
);

const DescriptionTab = ({ description }: { description: string | null }) => (
  <motion.div
    variants={tabContentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="prose prose-sm max-w-none dark:prose-invert"
  >
    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
      {description || "No description provided."}
    </p>
  </motion.div>
);

const DetailsTab = ({
  land,
  fullAddress,
  formattedLocation,
}: DetailsTabProps) => (
  <motion.div
    variants={tabContentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="grid grid-cols-1 md:grid-cols-2 gap-6"
  >
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Land Features</h3>
      <dl className="space-y-3">
        {[
          {
            icon: Droplets,
            label: "Irrigation",
            value: land.irrigationAvailable ? "Available" : "Not available",
            success: land.irrigationAvailable,
          },
          {
            icon: ZapIcon,
            label: "Electricity",
            value: land.electricityAvailable ? "Available" : "Not available",
            success: !!land.electricityAvailable,
          },
          {
            icon: Truck,
            label: "Road Access",
            value: land.roadAccess ? "Yes" : "No",
            success: !!land.roadAccess,
          },
          {
            icon: Lock,
            label: "Fencing",
            value: land.fencingAvailable ? "Available" : "Not available",
            success: !!land.fencingAvailable,
          },
        ].map((item, idx) => (
          <div
            key={`feature-${idx}`}
            className="flex items-center justify-between"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4 text-blue-500" />
              {item.label}
            </dt>
            <dd className={cn("font-medium", item.success && "text-green-600")}>
              {item.success ? (
                <CheckCircle2 className="h-4 w-4 inline mr-1" />
              ) : null}
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Soil & Water</h3>
      <dl className="space-y-3">
        {[
          { label: "Soil Type", value: land.soilType || "Not specified" },
          { label: "Water Source", value: land.waterSource || "Not specified" },
          ...(land.village ? [{ label: "Village", value: land.village }] : []),
          ...(land.pincode ? [{ label: "Pincode", value: land.pincode }] : []),
          ...(fullAddress && fullAddress !== formattedLocation
            ? [{ label: "Full Address", value: fullAddress, rightAlign: true }]
            : []),
        ].map((item, idx) => (
          <div
            key={`soil-${idx}`}
            className="flex items-center justify-between"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                "font-medium",
                item.rightAlign && "text-right max-w-[60%]",
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  </motion.div>
);

const DocumentsTab = ({ documents }: { documents?: Document[] }) => (
  <motion.div
    variants={tabContentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {documents && documents.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <a
            key={`doc-${doc.id}`}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {doc.type && `.${doc.type}`} •{" "}
                {doc.size && `${(doc.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No documents available</p>
      </div>
    )}
  </motion.div>
);

const BidsTab = ({ bids }: { bids?: Bid[] }) => (
  <motion.div
    variants={tabContentVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {bids && bids.length > 0 ? (
      <div className="space-y-3">
        {bids.map((bid) => (
          <div
            key={`bid-${bid.id}`}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={bid.farmer?.imageUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(bid.farmer?.name || "Bidder")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{bid.farmer?.name || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(bid.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                {formatCurrency(bid.amount)}
              </p>
              {bid.isAutoBid && (
                <Badge variant="outline" className="text-xs">
                  Auto-bid
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No bids yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to place a bid!
        </p>
      </div>
    )}
  </motion.div>
);

// ============= MAIN COMPONENT =============
export function ListingDetail({ listing }: ListingDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, new Date(listing.endDate).getTime() - Date.now()),
  );
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: clerkUser } = useUser();

  const allImages = useMemo(
    () => [...(listing.land.images || []), ...(listing.images || [])],
    [listing.land.images, listing.images],
  );
  const currentImage = useMemo(
    () => allImages[currentImageIndex]?.url || "/images/placeholder-land.jpg",
    [allImages, currentImageIndex],
  );

  const startDate = useMemo(
    () => new Date(listing.startDate),
    [listing.startDate],
  );
  const endDate = useMemo(() => new Date(listing.endDate), [listing.endDate]);
  const now = useMemo(() => new Date(), []);

  // ============= FETCH USER ROLE =============
  useEffect(() => {
    async function fetchUserRole() {
      if (!clerkUser?.id) {
        setUserRole(null);
        return;
      }
      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    }
    fetchUserRole();
  }, [clerkUser?.id]);

  // ============= COMPREHENSIVE AUCTION VALIDATION =============
  const isApproved = listing.status === "ACTIVE";
  const isOpenBidding = listing.listingType === "OPEN_BIDDING";
  const isAuctionLive = listing.auctionStatus === "LIVE";
  const isWithinDateRange = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isEnded = now > endDate;

  const isFarmer = userRole === "FARMER";
  const isAuctionActive =
    isApproved && isOpenBidding && isAuctionLive && isWithinDateRange;
  const canBid = isAuctionActive && isFarmer;

  const isEndingSoon = timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000;
  const bidCount = listing._count?.bids || 0;
  const savedCount = listing._count?.savedBy || 0;
  const currentBid = listing.highestBid || listing.basePrice;
  const bidIncrement = Math.max(1000, Math.floor(currentBid * 0.05));
  const nextMinimumBid = currentBid + bidIncrement;

  const formattedLocation =
    listing.land?.location ||
    `${listing.land?.district || ""}, ${listing.land?.state || ""}`.replace(
      /^,\s|,\s$/,
      "",
    ) ||
    "Location not specified";
  const fullAddress =
    listing.land?.address ||
    [
      listing.land?.village,
      listing.land?.district,
      listing.land?.state,
      listing.land?.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  const hasLocationData =
    !!(listing.land?.latitude && listing.land?.longitude) ||
    formattedLocation !== "Location not specified";

  // ============= CHECK INITIAL SAVE STATUS =============
  useEffect(() => {
    async function checkSavedStatus() {
      try {
        const res = await fetch("/api/marketplace/saved");
        if (res.ok) {
          const data = await res.json();
          const saved = data.saved?.some(
            (item: { listingId: string }) => item.listingId === listing.id,
          );
          setIsSaved(saved || false);
        }
      } catch (error) {
        console.error("Failed to check saved status:", error);
      }
    }

    checkSavedStatus();
  }, [listing.id]);

  // ============= TIMER EFFECT =============
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => Math.max(0, prev - 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  // ============= HANDLERS =============
  const handleViewOnMap = useCallback(() => {
    const coords = listing.land?.latitude && listing.land?.longitude;
    const url = coords
      ? `https://www.google.com/maps?q=${listing.land.latitude},${listing.land.longitude}`
      : formattedLocation !== "Location not specified"
        ? `https://www.google.com/maps/search/${encodeURIComponent(formattedLocation)}`
        : null;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else
      toast({
        title: "Location unavailable",
        description: "Map location is not available for this listing",
        variant: "destructive",
      });
  }, [
    listing.land?.latitude,
    listing.land?.longitude,
    formattedLocation,
    toast,
  ]);

  const handleGetDirections = useCallback(() => {
    const coords = listing.land?.latitude && listing.land?.longitude;
    const url = coords
      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.land.latitude},${listing.land.longitude}`
      : formattedLocation !== "Location not specified"
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedLocation)}`
        : null;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else
      toast({
        title: "Directions unavailable",
        description: "Cannot get directions for this location",
        variant: "destructive",
      });
  }, [
    listing.land?.latitude,
    listing.land?.longitude,
    formattedLocation,
    toast,
  ]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Listing URL copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSave = (saved: boolean) => {
    setIsSaved(saved);
    toast({
      title: saved ? "Added to saved" : "Removed from saved",
      description: saved
        ? "Listing saved to your collection"
        : "Listing removed from your saved items",
    });
  };

  const nextImage = () => {
    setImageDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    setIsImageLoading(true);
  };
  const prevImage = () => {
    setImageDirection(-1);
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length,
    );
    setIsImageLoading(true);
  };

  const getDemandScoreConfig = (score: number | null | undefined) => {
    if (!score)
      return {
        color: "text-gray-400",
        label: "Low",
        bg: "bg-gray-100 dark:bg-gray-900/30",
      };
    if (score >= 80)
      return {
        color: "text-green-600",
        label: "Very High",
        bg: "bg-green-100 dark:bg-green-950/30",
      };
    if (score >= 60)
      return {
        color: "text-yellow-600",
        label: "High",
        bg: "bg-yellow-100 dark:bg-yellow-950/30",
      };
    if (score >= 40)
      return {
        color: "text-orange-600",
        label: "Medium",
        bg: "bg-orange-100 dark:bg-orange-950/30",
      };
    return {
      color: "text-gray-400",
      label: "Low",
      bg: "bg-gray-100 dark:bg-gray-900/30",
    };
  };
  const demandConfig = getDemandScoreConfig(listing.analytics?.demandScore);

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return <DescriptionTab description={listing.description} />;
      case "details":
        return (
          <DetailsTab
            land={listing.land}
            fullAddress={fullAddress}
            formattedLocation={formattedLocation}
          />
        );
      case "documents":
        return <DocumentsTab documents={listing.land.documents} />;
      case "bids":
        return <BidsTab bids={listing.bids} />;
      default:
        return null;
    }
  };

  // ============= ACTION BUTTON WITH FARMER-ONLY RESTRICTION =============
  const renderActionButton = () => {
    // LIVE AUCTION - Only for FARMERS
    if (canBid) {
      return (
        <Button
          asChild
          size="lg"
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_30px_rgba(34,197,94,0.4)] transition-all duration-300 hover:-translate-y-0.5"
        >
          <Link href={`/marketplace/listings/${listing.id}/auction`}>
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-medium">Join Live Auction</span>
          </Link>
        </Button>
      );
    }

    // LIVE AUCTION - Restricted for non-farmers (landowners, admins, unauthenticated)
    if (isAuctionActive && !isFarmer) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="
    relative overflow-hidden
    px-5 py-4
    shadow-[0_8px_30px_rgba(0,0,0,0.06)]
  "
        >
          {/* subtle top accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-400/60 to-transparent" />

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Live Auction in Progress
                </p>

                <span
                  className="
            rounded-full border border-neutral-200 dark:border-neutral-700
            bg-neutral-100 dark:bg-neutral-900
            px-2 py-0.5
            text-[10px] font-medium uppercase tracking-[0.12em]
            text-neutral-600 dark:text-neutral-400
          "
                >
                  Restricted Access
                </span>
              </div>

              <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Participation in live auctions is currently limited to verified
                farmer accounts.
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    // PENDING APPROVAL - Visible to all users
    if (!isApproved) {
      return (
        <Button
          size="lg"
          disabled
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-yellow-100 text-yellow-700 cursor-not-allowed border border-yellow-200"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-200">
            <Hourglass className="h-4 w-4" />
          </span>
          <span className="font-medium">Pending Admin Approval</span>
        </Button>
      );
    }

    // FIXED PRICE - Visible to all users
    if (!isOpenBidding) {
      return (
        <Button
          size="lg"
          disabled
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
            <Ban className="h-4 w-4" />
          </span>
          <span className="font-medium">Fixed Price Listing</span>
        </Button>
      );
    }

    // UPCOMING - Visible to all users
    if (isUpcoming) {
      const daysUntilStart = Math.ceil(
        (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return (
        <Button
          size="lg"
          disabled
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-blue-100 text-blue-700 cursor-not-allowed border border-blue-200"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-200">
            <Clock className="h-4 w-4" />
          </span>
          <span className="font-medium">
            Auction Starts{" "}
            {daysUntilStart === 0
              ? "Today"
              : `in ${daysUntilStart} ${daysUntilStart === 1 ? "day" : "days"}`}
          </span>
        </Button>
      );
    }

    // ENDED - Visible to all users
    if (isEnded) {
      return (
        <Button
          size="lg"
          disabled
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
            <AlertCircle className="h-4 w-4" />
          </span>
          <span className="font-medium">Auction Ended</span>
        </Button>
      );
    }

    // NOT LIVE - Visible to all users
    if (!isAuctionLive) {
      return (
        <Button
          size="lg"
          disabled
          className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-orange-100 text-orange-700 cursor-not-allowed border border-orange-200"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-200">
            <AlertCircle className="h-4 w-4" />
          </span>
          <span className="font-medium">Auction Not Live</span>
        </Button>
      );
    }

    // FALLBACK
    return (
      <Button
        size="lg"
        disabled
        className="inline-flex items-center gap-3 px-5 h-12 rounded-full bg-gray-100 text-gray-500 cursor-not-allowed"
      >
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200">
          <AlertCircle className="h-4 w-4" />
        </span>
        <span className="font-medium">Unavailable</span>
      </Button>
    );
  };

  const renderStatusBadge = () => {
    // LIVE NOW - Show for everyone when auction is active
    if (isAuctionActive) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 animate-pulse shadow-lg px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 mr-1 fill-current" />
            LIVE NOW
          </Badge>
        </motion.div>
      );
    }
    if (!isApproved && isOpenBidding) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 mr-1" />
            PENDING APPROVAL
          </Badge>
        </motion.div>
      );
    }
    if (isUpcoming && isOpenBidding && isApproved) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            UPCOMING
          </Badge>
        </motion.div>
      );
    }
    if (isEndingSoon && isApproved && isAuctionLive) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge variant="destructive" className="shadow-lg px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Ending Soon
          </Badge>
        </motion.div>
      );
    }
    if (isEnded) {
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Badge variant="secondary" className="shadow-lg px-3 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Ended
          </Badge>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-18">
        <motion.nav
          variants={itemVariants}
          className="flex items-center text-sm text-muted-foreground mb-8"
        >
          <Link
            href="/marketplace"
            className="hover:text-primary transition-colors"
          >
            Marketplace
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-foreground font-medium line-clamp-1">
            {listing.title}
          </span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted/20 shadow-xl group">
              <AnimatePresence mode="wait" custom={imageDirection}>
                <motion.div
                  key={`image-${currentImageIndex}`}
                  custom={imageDirection}
                  variants={imageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Loader2 className="h-8 w-8 text-primary" />
                      </motion.div>
                    </div>
                  )}
                  <Image
                    src={currentImage}
                    alt={listing.title}
                    fill
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      isImageLoading ? "opacity-0" : "opacity-100",
                    )}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    onLoad={() => setIsImageLoading(false)}
                    unoptimized={process.env.NODE_ENV === "development"}
                  />
                </motion.div>
              </AnimatePresence>
              {allImages.length > 1 && (
                <>
                  <motion.button
                    onClick={prevImage}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    onClick={nextImage}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                </>
              )}
              {allImages.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-20"
                >
                  {currentImageIndex + 1} / {allImages.length}
                </motion.div>
              )}
              <div className="absolute top-4 left-4 flex gap-2 z-20">
                {renderStatusBadge()}
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <motion.button
                    key={`thumbnail-${index}`}
                    onClick={() => {
                      setImageDirection(index > currentImageIndex ? 1 : -1);
                      setCurrentImageIndex(index);
                      setIsImageLoading(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all",
                      index === currentImageIndex
                        ? "ring-2 ring-primary ring-offset-2 scale-105"
                        : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={process.env.NODE_ENV === "development"}
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                >
                  {listing.title}
                </motion.h1>
                <div className="flex gap-2">
                  <motion.div whileHover={hoverGlow} whileTap={tapScale}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      disabled={isSharing}
                      className="rounded-full"
                    >
                      {isSharing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                  <SavedButton
                    listingId={listing.id}
                    initialSaved={isSaved}
                    onToggle={handleSave}
                    size="icon"
                    className="rounded-full"
                  />
                </div>
              </div>
              {hasLocationData && (
                <MapButtons
                  onDirections={handleGetDirections}
                  onMap={handleViewOnMap}
                />
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={hoverScale}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Starting Price</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(listing.basePrice)}
                  </p>
                </div>
                {listing.highestBid && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-right"
                  >
                    <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(listing.highestBid)}
                    </p>
                  </motion.div>
                )}
              </div>
              {listing.highestBid && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Bid Progress</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {Math.round(
                        (listing.highestBid / listing.basePrice) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(listing.highestBid / listing.basePrice) * 100}
                    className="h-2 bg-gray-100 dark:bg-neutral-800"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Next minimum bid: {formatCurrency(nextMinimumBid)}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Time Left</p>
                  <p
                    className={cn(
                      "font-semibold flex items-center gap-1",
                      isWithinDateRange
                        ? "text-green-600"
                        : isEndingSoon
                          ? "text-orange-500"
                          : "text-gray-900 dark:text-white",
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    {formatTimeLeft(timeLeft)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Bids</p>
                  <p className="font-semibold flex items-center gap-1 text-gray-900 dark:text-white">
                    <Users className="h-4 w-4" />
                    {bidCount} {bidCount === 1 ? "bid" : "bids"}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <InfoBadge
                icon={Ruler}
                label="Land Size"
                value={`${listing.land.size} acres`}
                className="bg-white border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                iconClassName="text-gray-600"
              />
              <InfoBadge
                icon={Leaf}
                label="Land Type"
                value={listing.land.landType.toLowerCase()}
                className="bg-white border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                iconClassName="text-green-600"
              />
              <InfoBadge
                icon={Calendar}
                label="Lease Duration"
                value={`${listing.minimumLeaseDuration} - ${listing.maximumLeaseDuration} months`}
                className="bg-white border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                iconClassName="text-blue-500"
              />
              <InfoBadge
                icon={Heart}
                label="Saved"
                value={savedCount}
                className="bg-white border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                iconClassName="text-pink-500"
              />
            </div>

            {listing.analytics?.demandScore && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={hoverScale}
                className={cn(
                  "p-4 rounded-lg border",
                  demandConfig.bg,
                  "border-blue-200 dark:border-blue-800",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </motion.div>
                    <p className="text-sm font-medium">Market Demand</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("border-0", demandConfig.color)}
                  >
                    {demandConfig.label}
                  </Badge>
                </div>
                <Progress
                  value={listing.analytics.demandScore}
                  className="h-1.5"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{Math.round(listing.analytics.demandScore)}/100</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {listing.analytics.watchers} watching
                  </span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between px-5 py-3 rounded-full bg-white border border-gray-200 shadow-[0_8px_20px_rgba(0,0,0,0.06),_0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.10),_0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-gray-200 shadow-sm">
                  <AvatarImage src={listing.owner.imageUrl || ""} />
                  <AvatarFallback className="bg-gray-100 text-gray-800">
                    {getInitials(listing.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold flex items-center gap-1 text-gray-900">
                    {listing.owner.name}
                    {listing.owner.landownerProfile?.isVerified && (
                      <VerifiedBadge size="sm" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Landowner</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-gray-700 hover:bg-gray-100 rounded-full px-3 transition-all"
              >
                <Link href={`/profile/${listing.owner.id}`}>
                  View Profile
                  <ExternalLink className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={canBid ? hoverScale : undefined}
              whileTap={canBid ? tapScale : undefined}
              className="flex justify-center"
            >
              {renderActionButton()}
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="relative w-full overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-gray-300">
              <TabsList className="inline-flex items-center justify-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-full border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] w-auto min-w-max">
                <TabsTrigger
                  value="description"
                  className="px-4 sm:px-7 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold capitalize text-gray-700 transition-all duration-300 whitespace-nowrap data-[state=active]:bg-[#A3C47D] data-[state=active]:text-black data-[state=active]:shadow-md hover:bg-gray-100"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="px-4 sm:px-7 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold capitalize text-gray-700 transition-all duration-300 whitespace-nowrap data-[state=active]:bg-[#A3C47D] data-[state=active]:text-black data-[state=active]:shadow-md hover:bg-gray-100"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="px-4 sm:px-7 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold capitalize text-gray-700 transition-all duration-300 whitespace-nowrap data-[state=active]:bg-[#A3C47D] data-[state=active]:text-black data-[state=active]:shadow-md hover:bg-gray-100"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger
                  value="bids"
                  className="px-4 sm:px-7 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold text-gray-700 transition-all duration-300 whitespace-nowrap data-[state=active]:bg-[#A3C47D] data-[state=active]:text-black data-[state=active]:shadow-md hover:bg-gray-100"
                >
                  Recent Bids
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="p-4 sm:p-6 md:p-8 mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <AnimatePresence mode="wait">
                <div key={`tab-content-${activeTab}`}>{renderTabContent()}</div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
