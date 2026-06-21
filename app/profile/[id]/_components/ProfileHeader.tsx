// app/profile/[id]/_components/ProfileHeader.tsx
"use client";

import { motion } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Share2,
  MessageSquare,
  Loader2,
  FileText,
  CheckCircle
} from "lucide-react";
import { ProfileUser, AvailableLand, ExistingApplication } from "@/types/profile";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  user: ProfileUser & {
    avgRating?: number;
    totalReviews?: number;
  };
  currentUserRole?: string | null;
  currentUserId?: string | null;
}

export function ProfileHeader({ user, currentUserRole, currentUserId }: Props) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  
  // Fix: Use ref for Date.now() to maintain purity 
  const joinDateRef = useRef(new Date(user.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }));
  
  const [isSharing, setIsSharing] = useState(false);
  const [showContactTooltip, setShowContactTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const [availableLands, setAvailableLands] = useState<AvailableLand[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>("");
  
  const isFarmer = currentUserRole === "FARMER";
  const isLandowner = user.role === "LANDOWNER";
  const isOwnProfile = currentUserId === user.clerkId || currentUser?.id === user.clerkId;

  // FIXED: Moved checkExistingApplication BEFORE fetchAvailableLands
  const checkExistingApplication = useCallback(async (landId: string) => {
    try {
      const res = await fetch(`/api/applications/check?landId=${landId}`);
      const data = await res.json();
      setExistingApplication(data.application);
    } catch (error) {
      console.error("Failed to check application:", error);
    }
  }, []);

  const fetchAvailableLands = useCallback(async () => {
    try {
      const res = await fetch(`/api/landowner/lands?ownerId=${user.id}&isActive=true&isArchived=false`);
      const data = await res.json();
      setAvailableLands(data.lands || []);
      
      if (data.lands?.length > 0) {
        setSelectedLandId(data.lands[0].id);
        checkExistingApplication(data.lands[0].id); // Now safely called
      }
    } catch (error) {
      console.error("Failed to fetch lands:", error);
    }
  }, [user.id, checkExistingApplication]);

  useEffect(() => {
    if (showApplicationDialog && isFarmer && !isOwnProfile) {
      fetchAvailableLands();
    }
  }, [showApplicationDialog, isFarmer, isOwnProfile, fetchAvailableLands]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user.name} - Profile`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied!");
      }
    } catch {
      console.error("Share failed:");
    } finally {
      setIsSharing(false);
    }
  }, [user.name]);

  const handleRequestLease = useCallback(() => {
    if (!currentUser && !currentUserId) {
      router.push("/sign-in");
      return;
    }
    
    if (!isFarmer) {
      toast.error("Only farmers can request to lease land");
      return;
    }
    
    setShowApplicationDialog(true);
  }, [currentUser, currentUserId, isFarmer, router]);

  const handleStartApplication = useCallback(() => {
    if (selectedLandId) {
      router.push(`/applications/new?landId=${selectedLandId}&ownerId=${user.id}`);
    } else {
      router.push(`/applications/new?ownerId=${user.id}`);
    }
    setShowApplicationDialog(false);
  }, [selectedLandId, user.id, router]);

  const handleViewExistingApplication = useCallback(() => {
    if (existingApplication?.id) {
      router.push(`/applications/${existingApplication.id}`);
      setShowApplicationDialog(false);
    }
  }, [existingApplication?.id, router]);

  const handleContinueApplication = useCallback(() => {
    setIsLoading(true);
    handleStartApplication();
  }, [handleStartApplication]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10"
      >
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="
          group relative flex flex-col gap-4 px-8 md:px-12 py-5
          rounded-full border border-gray-200
          bg-white/80 backdrop-blur-xl
          shadow-[0_8px_24px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04)]
          hover:shadow-[0_18px_48px_rgba(0,0,0,0.10)]
          overflow-visible mt-16
          "
        >
          <div className="absolute inset-[1px] rounded-full border border-white/40 pointer-events-none" />

          {/* MAIN */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* LEFT */}
            <div className="flex items-center gap-4 flex-1">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-lg font-semibold text-emerald-800 border border-emerald-300 shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                    {user.name}
                  </h1>
                  {user.role === "LANDOWNER" && (
                    <Badge variant="secondary" className="text-xs">
                      Landowner
                    </Badge>
                  )}
                  {user.role === "FARMER" && (
                    <Badge variant="secondary" className="text-xs">
                      Farmer
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.location}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {joinDateRef.current}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT BUTTONS */}
            <div className="flex gap-3 shrink-0 mt-7 lg:mt-0">
              
              {/* REQUEST TO LEASE BUTTON */}
              {isFarmer && isLandowner && !isOwnProfile && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRequestLease}
                  className="
                    relative z-50
                    rounded-full px-5 h-10
                    bg-white border border-emerald-200
                    text-emerald-700 text-sm font-medium
                    shadow-[0_4px_12px_rgba(16,185,129,0.15)]
                    hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)]
                    hover:bg-emerald-50
                    transition-all duration-300
                  "
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Request to Lease
                  </div>
                </motion.button>
              )}

              {/* CONTACT */}
              <div 
                className="relative"
                onMouseEnter={() => setShowContactTooltip(true)}
                onMouseLeave={() => setShowContactTooltip(false)}
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="
                    rounded-full px-5 h-10
                    bg-white/90 backdrop-blur-xl
                    border border-gray-200
                    text-gray-900 text-sm font-medium
                    shadow-[0_6px_18px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]
                    transition-all duration-300
                  "
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact
                  </div>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: showContactTooltip ? 1 : 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
                >
                  <div className="relative bg-black text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                    This message will be sent to the {isLandowner ? "land owner" : "farmer"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                  </div>
                </motion.div>
              </div>

              {/* SHARE */}
              <div 
                className="relative"
                onMouseEnter={() => setShowShareTooltip(true)}
                onMouseLeave={() => setShowShareTooltip(false)}
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  disabled={isSharing}
                  className="
                    rounded-full px-5 h-10
                    bg-white/90 backdrop-blur-xl
                    border border-gray-200
                    text-gray-900 text-sm font-medium
                    shadow-[0_6px_18px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_10px_28px_rgba(0,0,0,0.12)]
                    transition-all duration-300
                  "
                >
                  <div className="flex items-center gap-2">
                    {isSharing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share
                      </>
                    )}
                  </div>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: showShareTooltip ? 1 : 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
                >
                  <div className="relative bg-black text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                    Share this profile with others
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* BIO */}
          {user.bio && (
            <p className="text-sm text-gray-900 max-w-2xl pt-3 border-t border-gray-200">
              {user.bio}
            </p>
          )}
        </motion.div>
      </motion.section>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Lease Land</DialogTitle>
            <DialogDescription>
              Submit an application to lease land from {user.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {existingApplication ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        You already have an active application
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Status: <Badge variant="secondary">{existingApplication.status}</Badge>
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Submitted on {new Date(existingApplication.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : availableLands.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  This landowner has no active lands available for lease at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select a land to apply for:
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableLands.map((land) => (
                      <label
                        key={land.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                          ${selectedLandId === land.id 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                            : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        <input
                          type="radio"
                          name="land"
                          value={land.id}
                          checked={selectedLandId === land.id}
                          onChange={(e) => {
                            setSelectedLandId(e.target.value);
                            checkExistingApplication(e.target.value);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{land.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {[land.village, land.district, land.state].filter(Boolean).join(", ")}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{land.size} acres</span>
                            <span>{land.landType}</span>
                            <span>{land.minLeaseDuration}-{land.maxLeaseDuration} months</span>
                          </div>
                          {land.expectedRentMin && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expected Rent: ₹{land.expectedRentMin.toLocaleString('en-IN')}
                              {land.expectedRentMax && ` - ₹${land.expectedRentMax.toLocaleString('en-IN')}`}/month
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Cancel
            </Button>
            
            {existingApplication ? (
              <Button onClick={handleViewExistingApplication}>
                View Application
              </Button>
            ) : availableLands.length > 0 ? (
              <Button 
                onClick={handleContinueApplication}
                disabled={!selectedLandId || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue to Application'
                )}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}