// hooks/usePusher.ts
import { useEffect } from 'react'
import { getPusherClient } from '@/lib/pusher/client'

// Define types that match your API response
export interface NewBidEvent {
  bid: {
    id: string
    amount: number
    farmerId: string
    createdAt: string | Date
  }
  timestamp: string
}

export interface AuctionExtendedEvent {
  message: string
  newEndTime?: string
}

interface PusherCallbacks {
  onNewBid?: (data: NewBidEvent) => void
  onAuctionExtended?: (data: AuctionExtendedEvent) => void
}

export function usePusher(channel: string, callbacks: PusherCallbacks) {
  useEffect(() => {
    const client = getPusherClient()
    if (!client) return

    const ch = client.subscribe(channel)

    if (callbacks.onNewBid) {
      ch.bind('new-bid', callbacks.onNewBid)
    }
    if (callbacks.onAuctionExtended) {
      ch.bind('auction-extended', callbacks.onAuctionExtended)
    }

    return () => {
      if (callbacks.onNewBid) {
        ch.unbind('new-bid', callbacks.onNewBid)
      }
      if (callbacks.onAuctionExtended) {
        ch.unbind('auction-extended', callbacks.onAuctionExtended)
      }
      client.unsubscribe(channel)
    }
  }, [channel, callbacks.onNewBid, callbacks.onAuctionExtended])
}