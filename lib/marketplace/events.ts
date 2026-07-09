// lib/marketplace/events.ts
import { pusherServer } from '@/lib/pusher/server';
import { logger } from './logger';

interface BidEvent {
  id: string;
  amount: number;
  farmerId: string;
  createdAt: Date | string;
}

class AuctionEventService {
  private async trigger(channel: string, event: string, data: unknown): Promise<void> {
    try {
      await pusherServer.trigger(channel, event, data);
      logger.info('Event triggered', { channel, event });
    } catch (error) {
      logger.error('Failed to trigger event', error as Error, { channel, event });
    }
  }

  async emitNewBid(listingId: string, bid: BidEvent): Promise<void> {
    await this.trigger(`auction-${listingId}`, 'new-bid', {
      bid: {
        id: bid.id,
        amount: bid.amount,
        farmerId: bid.farmerId,
        createdAt: bid.createdAt instanceof Date ? bid.createdAt.toISOString() : bid.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  }

  async emitAuctionExtended(listingId: string, newEndTime: Date, extendedByMinutes: number): Promise<void> {
    await this.trigger(`auction-${listingId}`, 'auction-extended', {
      message: 'Auction extended due to late bidding',
      newEndTime: newEndTime.toISOString(),
      extendedByMinutes,
    });
  }

  async emitAuctionEnded(listingId: string, winningBid: Record<string, unknown> | null): Promise<void> {
    await this.trigger(`auction-${listingId}`, 'auction-ended', {
      message: 'Auction has ended',
      winningBid: winningBid ? {
        id: winningBid.id,
        amount: winningBid.amount,
        farmerId: winningBid.farmerId,
      } : null,
      timestamp: new Date().toISOString(),
    });
  }

  async emitBidError(listingId: string, userId: string, error: string): Promise<void> {
    await this.trigger(`auction-${listingId}`, 'bid-error', {
      userId,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

export const auctionEvents = new AuctionEventService();