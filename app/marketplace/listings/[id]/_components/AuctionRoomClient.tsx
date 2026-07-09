'use client'

import { useState } from 'react'
import { useAuction } from '@/hooks/useAuction'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Timer, 
  Users, 
  TrendingUp, 
  Award,
  Zap,
  Clock,
  Gavel,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatTimeLeft, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { BidDTO, AuctionDTO } from '@/lib/marketplace/types'

interface AuctionData {
  id: string
  title: string
  description?: string | null
  basePrice: number
  reservePrice?: number | null
  bidIncrement?: number | null
  endDate: string
  auctionStatus: string
  autoExtendMinutes?: number | null
  winningBidId?: string | null
  currentLeaderId?: string | null
  highestBid?: number | null
  winningBid?: {
    id: string
    amount: number
    farmer: { id: string; name: string }
  } | null
  _count?: { bids: number }
  bids?: BidDTO[]
}

type AuctionDataCompat = AuctionData | AuctionDTO

function getAuctionData(data: AuctionDataCompat): AuctionData {
  if ('listing' in data) {
    const a = data as AuctionDTO
    return {
      id: a.listing.id,
      title: a.listing.title,
      description: a.listing.description,
      basePrice: a.listing.basePrice,
      bidIncrement: a.listing.bidIncrement,
      endDate: a.listing.endDate,
      auctionStatus: a.listing.auctionStatus,
      autoExtendMinutes: a.listing.autoExtendMinutes,
      currentLeaderId: a.listing.currentLeaderId,
      highestBid: a.listing.highestBid,
      winningBid: a.listing.winningBid,
      _count: { bids: a.stats.totalBids },
      bids: a.listing.bids,
    }
  }
  return data as AuctionData
}

interface AuctionRoomClientProps {
  listingId: string
  initialData: AuctionData
}

const formatBidDate = (date: string | Date): string => {
  return new Date(date).toLocaleString()
}

export function AuctionRoomClient({ listingId, initialData }: AuctionRoomClientProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [isAutoBid, setIsAutoBid] = useState(false)
  const { toast } = useToast()
  
  const { auction, bids, loading, placeBid, timeRemaining, isLive, error } = useAuction(listingId)

  const currentAuction = getAuctionData(auction || initialData)
  const currentBids = (bids.length > 0 ? bids : currentAuction.bids || [])
  
  const highestBid = currentBids[0]?.amount || currentAuction.basePrice || 0
  const minNextBid = highestBid + (currentAuction.bidIncrement || 1000)

  const handlePlaceBid = async () => {
    if (!bidAmount) return
    const amount = parseFloat(bidAmount)
    if (amount < minNextBid) {
      toast({ title: 'Bid too low', description: "Minimum bid is " + formatCurrency(minNextBid), variant: 'destructive' })
      return
    }
    try {
      await placeBid(amount, isAutoBid)
      setBidAmount('')
      toast({ title: 'Bid placed successfully!', description: 'Your bid has been registered.' })
    } catch (err) {
      toast({ title: 'Failed to place bid', description: err instanceof Error ? err.message : 'Please try again', variant: 'destructive' })
    }
  }

  if (!currentAuction) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-muted-foreground">Auction not found</p></div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-11">
      {error && <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" /><p className="text-sm">{error}</p></div>}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{currentAuction.title}</h1>
        <div className="flex items-center gap-4">
          <Badge variant={isLive ? 'default' : 'secondary'} className="gap-1">{isLive ? <><Zap className="h-3 w-3" />LIVE AUCTION</> : 'AUCTION ENDED'}</Badge>
          <span className="text-sm text-muted-foreground">Listing ID: {listingId}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div><p className="text-sm text-muted-foreground">Current Bid</p><p className="text-2xl font-bold text-primary">{formatCurrency(highestBid)}</p></div>
              <div><p className="text-sm text-muted-foreground">Your Bid</p><p className="text-2xl font-bold">{formatCurrency(0)}</p></div>
              <div><p className="text-sm text-muted-foreground">Time Left</p><p className="text-2xl font-bold flex items-center gap-1"><Timer className="h-5 w-5 text-muted-foreground" />{formatTimeLeft(timeRemaining)}</p></div>
              <div><p className="text-sm text-muted-foreground">Total Bids</p><p className="text-2xl font-bold">{currentAuction._count?.bids || 0}</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input type="number" placeholder={"Min " + formatCurrency(minNextBid)} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} min={minNextBid} step={currentAuction.bidIncrement || 100} disabled={!isLive} className="flex-1" />
                <Button onClick={handlePlaceBid} disabled={!isLive || loading} size="lg" className="min-w-[120px]">{loading ? 'Placing...' : 'Place Bid'}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[minNextBid, minNextBid + 5000, minNextBid + 10000, minNextBid + 20000].map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setBidAmount(amount.toString())} disabled={!isLive}>+{formatCurrency(amount - highestBid)}</Button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isAutoBid} onChange={(e) => setIsAutoBid(e.target.checked)} disabled={!isLive} className="rounded border-gray-300" />
                Enable auto-bidding
              </label>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Gavel className="h-5 w-5" />Bid History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentBids.map((bid: BidDTO, index: number) => (
                <div key={bid.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Badge className="bg-yellow-500">Leader</Badge>}
                    <Avatar className="h-8 w-8"><AvatarImage src={bid.farmer?.imageUrl || ''} /><AvatarFallback className="text-xs">{getInitials(bid.farmer?.name || 'Bidder')}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{bid.farmer?.name || 'Anonymous'}</p><p className="text-xs text-muted-foreground">{formatBidDate(bid.createdAt)}</p></div>
                  </div>
                  <div className="text-right"><p className="font-bold text-lg">{formatCurrency(bid.amount)}</p>{bid.isAutoBid && <Badge variant="outline" className="text-xs">Auto</Badge>}</div>
                </div>
              ))}
              {currentBids.length === 0 && <p className="text-center text-muted-foreground py-8">No bids yet. Be the first to bid!</p>}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Auction Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-muted-foreground">Starting Price</dt><dd className="font-medium">{formatCurrency(currentAuction.basePrice)}</dd></div>
              {currentAuction.reservePrice && <div className="flex justify-between"><dt className="text-muted-foreground">Reserve Price</dt><dd className="font-medium">{formatCurrency(currentAuction.reservePrice)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Bid Increment</dt><dd className="font-medium">{formatCurrency(currentAuction.bidIncrement || 1000)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ends At</dt><dd className="font-medium">{new Date(currentAuction.endDate).toLocaleString()}</dd></div>
              {currentAuction.autoExtendMinutes && <div className="flex justify-between"><dt className="text-muted-foreground">Auto-extend</dt><dd className="font-medium">Yes ({currentAuction.autoExtendMinutes} min)</dd></div>}
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" />Unique Bidders</dt><dd className="font-medium">{new Set(currentBids.map((b: BidDTO) => b.farmerId)).size}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" />Bid Activity</dt><dd className="font-medium">{currentBids.length} total bids</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground flex items-center gap-1"><Award className="h-4 w-4" />Winning Bid</dt><dd className="font-medium">{currentAuction.winningBid ? formatCurrency(currentAuction.winningBid.amount) : 'Not yet'}</dd></div>
            </dl>
          </Card>
          {currentAuction.autoExtendMinutes && isLive && (
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2"><Clock className="h-4 w-4" />Auction auto-extends by {currentAuction.autoExtendMinutes} minutes if a bid is placed in the last 5 minutes.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}