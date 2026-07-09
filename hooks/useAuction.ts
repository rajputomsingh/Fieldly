// hooks/useAuction.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { usePusher } from "./usePusher"
import type { NewBidEvent } from "./usePusher";
import type { AuctionDTO, BidDTO } from "@/lib/marketplace/types";

interface UseAuctionReturn {
  auction: AuctionDTO | null;
  bids: BidDTO[];
  loading: boolean;
  error: string | null;
  placeBid: (amount: number, isAutoBid?: boolean) => Promise<void>;
  timeRemaining: number;
  isLive: boolean;
  canBid: boolean;
  validationMessage: string | null;
}

export function useAuction(listingId: string): UseAuctionReturn {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [auction, setAuction] = useState<AuctionDTO | null>(null);
  const [bids, setBids] = useState<BidDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [isFarmer, setIsFarmer] = useState(false);
  const [, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function getFarmerId() {
      if (!isClerkLoaded || !clerkUser) {
        setFarmerId(null);
        setIsFarmer(false);
        setUserRole(null);
        return;
      }
      try {
        const res = await fetch("/api/user/by-clerk/" + clerkUser.id);
        const result = await res.json();
        if (result.user?.id) {
          setFarmerId(result.user.id);
          setIsFarmer(result.user.role === "FARMER");
          setUserRole(result.user.role);
        } else {
          setFarmerId(null);
          setIsFarmer(false);
          setUserRole(null);
        }
      } catch {
        setFarmerId(null);
        setIsFarmer(false);
        setUserRole(null);
      }
    }
    getFarmerId();
  }, [clerkUser, isClerkLoaded]);

  const fetchAuctionData = useCallback(async () => {
    try {
      const response = await fetch("/api/marketplace/" + listingId);
      if (!response.ok) throw new Error("Failed to fetch auction");
      const result = await response.json();
      const data = result.data || result;
      setAuction(data);
      setBids(data.bids || []);
      const endTime = new Date(data.endDate).getTime();
      setTimeRemaining(Math.max(0, endTime - Date.now()));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  usePusher("auction-" + listingId, {
    onNewBid: (data: NewBidEvent) => {
      const bidData = data.bid as Record<string, unknown>;
      const newBid: BidDTO = {
        id: bidData.id as string,
        amount: bidData.amount as number,
        farmerId: bidData.farmerId as string,
        createdAt: bidData.createdAt as string,
        isAutoBid: false,
        farmer: {
          id: bidData.farmerId as string,
          name: "",
          imageUrl: null,
        },
      };
      setBids((prev) => [newBid, ...prev]);
    },
    onAuctionExtended: () => {
      fetchAuctionData();
    },
  });

  useEffect(() => {
    if (!auction) return;
    const now = Date.now();
    const startTime = new Date(auction.listing.startDate).getTime();
    const endTime = new Date(auction.listing.endDate).getTime();
    const isAuctionLive = now >= startTime && now <= endTime;
    if (!isAuctionLive) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  const { canBid, validationMessage } = useMemo(() => {
    if (!auction) return { canBid: false, validationMessage: "Loading auction data..." };
    if (!clerkUser) return { canBid: false, validationMessage: "You must be signed in to place a bid" };
    if (!isFarmer) return { canBid: false, validationMessage: "Only farmers can place bids" };
    if (!farmerId) return { canBid: false, validationMessage: "User profile not found" };
    return { canBid: true, validationMessage: null };
  }, [auction, clerkUser, isFarmer, farmerId]);

  const isLive = useMemo(() => {
    if (!auction) return false;
    return auction.listing.auctionStatus === "LIVE";
  }, [auction]);

  const placeBid = useCallback(async (amount: number, isAutoBid = false) => {
    if (!canBid) throw new Error(validationMessage || "Cannot place bid");
    if (!farmerId) throw new Error("User profile not found");
    if (!auction) throw new Error("Auction data not available");

    const highestBid = bids[0]?.amount || auction.listing.basePrice;
    const minBid = highestBid + (auction.listing.bidIncrement || 1000);
    if (amount < minBid) throw new Error("Bid must be at least ?" + minBid.toLocaleString());

    try {
      const response = await fetch("/api/marketplace/" + listingId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, amount, isAutoBid }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to place bid");
      await fetchAuctionData();
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place bid";
      setError(msg);
      throw err;
    }
  }, [listingId, farmerId, canBid, validationMessage, auction, bids, fetchAuctionData]);

  return { auction, bids, loading, error, placeBid, timeRemaining, isLive, canBid, validationMessage };
}
