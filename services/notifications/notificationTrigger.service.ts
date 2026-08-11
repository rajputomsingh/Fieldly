// services/notifications/notificationTrigger.service.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createNotification } from '@/actions/notifications/createNotification';
import { pusherServer } from '@/lib/pusher/server';
import type { NotificationType, NotificationPriority } from '@/types/notification.types';
import { Prisma } from '@prisma/client';

interface TriggerParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  priority?: NotificationPriority;
}

export async function triggerNotification(params: TriggerParams) {
  try {
    const result = await createNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl || null,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      priority: params.priority || 'MEDIUM',
    });

    if (result.success && result.notification) {
      await pusherServer.trigger(
        `private-user-${params.userId}`,
        'new-notification',
        result.notification
      );
    }

    return result;
  } catch (error) {
    console.error('Failed to trigger notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function triggerBulkNotifications(notifications: TriggerParams[]) {
  try {
    const results = await Promise.allSettled(
      notifications.map(params => triggerNotification(params))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    return { success: true, sent: succeeded, failed };
  } catch (error) {
    console.error('Failed to trigger bulk notifications:', error);
    return { success: false, error: 'Failed to send bulk notifications' };
  }
}

export async function notifyMatchingFarmersAboutListing(landId: string, listingId: string) {
  try {
    const land = await prisma.land.findUnique({
      where: { id: landId },
      include: {
        listings: { where: { id: listingId } },
        landowner: { include: { user: true } },
      },
    });

    if (!land || !land.listings[0]) {
      return { success: false, error: 'Land or listing not found' };
    }

    const sizeCondition = {
      requiredLandSize: {
        lte: land.size * 1.5,
        gte: land.size * 0.5,
      },
    };

    const cropCondition = land.allowedCropTypes.length > 0
      ? { primaryCrops: { hasSome: land.allowedCropTypes } }
      : null;

    const districtCondition = land.district
      ? { user: { district: land.district } }
      : null;

    const stateCondition = land.state
      ? { user: { state: land.state } }
      : null;

    const orConditions: Prisma.FarmerProfileWhereInput[] = [sizeCondition];
    if (cropCondition) orConditions.push(cropCondition);
    if (districtCondition) orConditions.push(districtCondition);
    if (stateCondition) orConditions.push(stateCondition);

    const matchingFarmers = await prisma.user.findMany({
      where: {
        role: 'FARMER',
        isOnboarded: true,
        AND: [
          { farmerProfile: { isNot: null } },
          { farmerProfile: { OR: orConditions } },
        ],
      },
      select: { id: true, name: true },
    });

    let finalFarmers: { id: string; name: string | null }[] = matchingFarmers;
    
    if (matchingFarmers.length === 0) {
      console.log('No matching farmers found, notifying all onboarded farmers as fallback');
      finalFarmers = await prisma.user.findMany({
        where: {
          role: 'FARMER',
          isOnboarded: true,
        },
        select: { id: true, name: true },
      });
    }

    if (finalFarmers.length === 0) {
      return { success: true, notified: 0, message: 'No farmers found to notify' };
    }

    const notifications: TriggerParams[] = finalFarmers.map(farmer => ({
      userId: farmer.id,
      type: 'LISTING',
      title: matchingFarmers.length > 0 
        ? 'New Land Listing Matching Your Preferences'
        : 'New Land Listing Available',
      message: `${land.size} acres of ${land.landType.toLowerCase()} land available in ${land.village || 'your area'}, ${land.district || land.state || ''}. ${land.irrigationAvailable ? 'Irrigation available.' : ''} Click to view details.`,
      actionUrl: `/marketplace/listings/${listingId}`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: 'HIGH',
    }));

    const result = await triggerBulkNotifications(notifications);
    
    console.log(`Notified ${result.sent} farmers about new listing (matched: ${matchingFarmers.length}, total: ${finalFarmers.length})`);
    
    return { 
      success: true, 
      notified: result.sent, 
      matched: matchingFarmers.length,
      total: finalFarmers.length,
      message: `Notified ${result.sent} farmers` 
    };
  } catch (error) {
    console.error('Failed to notify matching farmers:', error);
    return { success: false, error: 'Failed to notify farmers' };
  }
}

export async function notifyAuctionStatusChange(
  listingId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
) {
  try {
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      include: {
        land: { select: { title: true, size: true, landType: true } },
        owner: { select: { id: true, name: true } },
        bids: {
          where: { status: 'ACTIVE' },
          select: { farmerId: true },
          distinct: ['farmerId'],
        },
        savedBy: {
          select: { userId: true },
        },
      },
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    const bidderIds = listing.bids.map(b => b.farmerId);
    const watcherIds = listing.savedBy.map(s => s.userId);
    let allFarmerIds = [...new Set([...bidderIds, ...watcherIds])];

    if (allFarmerIds.length === 0 && newStatus === 'LIVE') {
      console.log(`No watchers/bidders for listing ${listingId}, notifying all onboarded farmers`);
      
      const allFarmers = await prisma.user.findMany({
        where: {
          role: 'FARMER',
          isOnboarded: true,
        },
        select: { id: true, name: true },
      });
      
      allFarmerIds = allFarmers.map(f => f.id);
    }

    if (allFarmerIds.length === 0) {
      console.log(`No farmers to notify for auction status change on listing ${listingId}`);
      return { success: true, notified: 0, message: 'No farmers to notify' };
    }

    const farmers = await prisma.user.findMany({
      where: { id: { in: allFarmerIds } },
      select: { id: true, name: true },
    });

    const statusMessages: Record<string, { title: string; message: string }> = {
      LIVE: {
        title: 'Auction is NOW LIVE',
        message: `The auction for "${listing.land.title}" (${listing.land.size} acres ${listing.land.landType.toLowerCase()}) is now LIVE. Place your bids before it ends.`,
      },
      CLOSED: {
        title: 'Auction Ended',
        message: `The auction for "${listing.land.title}" has ended. Check the listing for final results.`,
      },
      SETTLED: {
        title: 'Auction Settled',
        message: `The auction for "${listing.land.title}" has been settled. ${listing.highestBid ? `Winning bid: Rs ${Number(listing.highestBid?.toNumber() ?? 0).toLocaleString('en-IN')}` : ''}`,
      },
      PAUSED: {
        title: 'Auction Paused',
        message: `The auction for "${listing.land.title}" has been temporarily paused. ${reason ? `Reason: ${reason}` : 'We will notify you when it resumes.'}`,
      },
      FAILED: {
        title: 'Auction Failed',
        message: `The auction for "${listing.land.title}" has failed. ${reason ? `Reason: ${reason}` : 'The listing may be relisted later.'}`,
      },
    };

    const msg = statusMessages[newStatus];
    if (!msg) {
      return { success: true, message: 'No notification needed for this status' };
    }

    const notifications: TriggerParams[] = farmers.map(farmer => ({
      userId: farmer.id,
      type: 'LISTING',
      title: msg.title,
      message: msg.message,
      actionUrl: `/marketplace/listings/${listingId}`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: newStatus === 'LIVE' ? 'HIGH' : 'MEDIUM',
    }));

    const result = await triggerBulkNotifications(notifications);

    console.log(`Notified ${result.sent} farmers about auction status change: ${oldStatus} to ${newStatus}`);

    return {
      success: true,
      notified: result.sent,
      oldStatus,
      newStatus,
      message: `Notified ${result.sent} farmers`,
    };
  } catch (error) {
    console.error('Failed to notify auction status change:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function notifyAuctionStartingSoon(listingId: string) {
  try {
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      include: {
        land: { select: { title: true, size: true, landType: true } },
        savedBy: {
          select: { userId: true },
        },
      },
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    const watcherIds = listing.savedBy.map(s => s.userId);

    if (watcherIds.length === 0) {
      return { success: true, notified: 0, message: 'No watchers to notify' };
    }

    const farmers = await prisma.user.findMany({
      where: { id: { in: watcherIds } },
      select: { id: true, name: true },
    });

    const timeUntilStart = listing.startDate.getTime() - Date.now();
    const hoursUntilStart = Math.round(timeUntilStart / (1000 * 60 * 60));

    const notifications: TriggerParams[] = farmers.map(farmer => ({
      userId: farmer.id,
      type: 'LISTING',
      title: 'Auction Starting Soon',
      message: `The auction for "${listing.land.title}" (${listing.land.size} acres) starts in about ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}. Get ready to bid.`,
      actionUrl: `/marketplace/listings/${listingId}`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: 'HIGH',
    }));

    const result = await triggerBulkNotifications(notifications);

    console.log(`Notified ${result.sent} farmers about auction starting soon: ${listingId}`);

    return { success: true, notified: result.sent };
  } catch (error) {
    console.error('Failed to notify auction starting soon:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function notifyAuctionEndingSoon(listingId: string) {
  try {
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      include: {
        land: { select: { title: true, size: true, landType: true } },
        bids: {
          where: { status: 'ACTIVE' },
          select: { farmerId: true },
          distinct: ['farmerId'],
        },
        savedBy: {
          select: { userId: true },
        },
      },
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    const bidderIds = listing.bids.map(b => b.farmerId);
    const watcherIds = listing.savedBy.map(s => s.userId);
    const allFarmerIds = [...new Set([...bidderIds, ...watcherIds])];

    if (allFarmerIds.length === 0) {
      return { success: true, notified: 0, message: 'No farmers to notify' };
    }

    const farmers = await prisma.user.findMany({
      where: { id: { in: allFarmerIds } },
      select: { id: true, name: true },
    });

    const timeLeft = listing.endDate.getTime() - Date.now();
    const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60));

    const notifications: TriggerParams[] = farmers.map(farmer => ({
      userId: farmer.id,
      type: 'LISTING',
      title: 'Auction Ending Soon',
      message: `The auction for "${listing.land.title}" ends in about ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}. ${bidderIds.includes(farmer.id) ? 'Make your final bid.' : 'Place your bid before it ends.'}`,
      actionUrl: `/marketplace/listings/${listingId}`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: 'HIGH',
    }));

    const result = await triggerBulkNotifications(notifications);

    console.log(`Notified ${result.sent} farmers about auction ending soon: ${listingId}`);

    return { success: true, notified: result.sent };
  } catch (error) {
    console.error('Failed to notify auction ending soon:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function notifyFarmerOutbid(listingId: string, outbidFarmerId: string, newBidAmount: number) {
  try {
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      include: {
        land: { select: { title: true } },
      },
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    const farmer = await prisma.user.findUnique({
      where: { id: outbidFarmerId },
      select: { id: true, name: true },
    });

    if (!farmer) {
      return { success: false, error: 'Farmer not found' };
    }

    return triggerNotification({
      userId: outbidFarmerId,
      type: 'BID',
      title: 'You have Been Outbid',
      message: `Someone placed a higher bid of Rs ${newBidAmount.toLocaleString('en-IN')} on "${listing.land.title}". Visit the listing to increase your bid.`,
      actionUrl: `/marketplace/listings/${listingId}`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: 'HIGH',
    });
  } catch (error) {
    console.error('Failed to notify outbid farmer:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function notifyBidAccepted(listingId: string, winningFarmerId: string, winningAmount: number) {
  try {
    const listing = await prisma.landListing.findUnique({
      where: { id: listingId },
      include: {
        land: { select: { title: true } },
        owner: { select: { name: true } },
      },
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    return triggerNotification({
      userId: winningFarmerId,
      type: 'BID',
      title: 'Congratulations Your Bid Won',
      message: `Your bid of Rs ${winningAmount.toLocaleString('en-IN')} for "${listing.land.title}" has been accepted. The landowner (${listing.owner.name}) will contact you to finalize the lease.`,
      actionUrl: `/applications`,
      entityType: 'LISTING',
      entityId: listingId,
      priority: 'HIGH',
    });
  } catch (error) {
    console.error('Failed to notify bid accepted:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function notifyLandownerAboutApplication(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        land: { include: { landowner: { include: { user: true } } } },
        farmer: true,
      },
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    return triggerNotification({
      userId: application.land.landowner.user.id,
      type: 'APPLICATION',
      title: 'New Application Received',
      message: `${application.farmer.name} has applied for "${application.land.title}". Proposed rent: Rs ${Number(application.proposedRent?.toNumber() ?? 0).toLocaleString('en-IN') || 'N/A'}.`,
      actionUrl: `/applications/${applicationId}`,
      entityType: 'APPLICATION',
      entityId: applicationId,
      priority: 'HIGH',
    });
  } catch (error) {
    console.error('Failed to notify landowner about application:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function notifyAboutNewBid(bidId: string) {
  try {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        listing: { include: { owner: true } },
        farmer: true,
      },
    });

    if (!bid) {
      return { success: false, error: 'Bid not found' };
    }

    const notifications: TriggerParams[] = [];

    notifications.push({
      userId: bid.listing.owner.id,
      type: 'BID',
      title: 'New Bid Placed',
      message: `${bid.farmer.name} placed a bid of Rs ${Number(bid.amount?.toNumber() ?? 0).toLocaleString('en-IN')} on "${bid.listing.title}".`,
      actionUrl: `/marketplace/listings/${bid.listingId}`,
      entityType: 'BID',
      entityId: bidId,
      priority: 'HIGH',
    });

    const otherBids = await prisma.bid.findMany({
      where: {
        listingId: bid.listingId,
        farmerId: { not: bid.farmerId },
        status: 'ACTIVE',
      },
      select: { farmerId: true },
    });

    const outbidNotifications = otherBids.map(b => ({
      userId: b.farmerId,
      type: 'BID' as NotificationType,
      title: 'You have Been Outbid',
      message: `Someone placed a higher bid of Rs ${Number(bid.amount?.toNumber() ?? 0).toLocaleString('en-IN')} on "${bid.listing.title}".`,
      actionUrl: `/marketplace/listings/${bid.listingId}`,
      entityType: 'BID',
      entityId: bidId,
      priority: 'HIGH' as NotificationPriority,
    }));

    notifications.push(...outbidNotifications);

    const result = await triggerBulkNotifications(notifications);
    return { 
      success: true, 
      sent: result.sent, 
      failed: result.failed,
      message: `Sent ${result.sent} notifications` 
    };
  } catch (error) {
    console.error('Failed to send bid notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function notifyLeaseCreated(leaseId: string) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        land: true,
        farmer: true,
        owner: true,
      },
    });

    if (!lease) {
      return { success: false, error: 'Lease not found' };
    }

    const notifications: TriggerParams[] = [
      {
        userId: lease.farmerId,
        type: 'LEASE',
        title: 'Lease Agreement Created',
        message: `Lease agreement for "${lease.land.title}" has been created. Please review and sign.`,
        actionUrl: `/applications/${lease.id}`,
        entityType: 'LEASE',
        entityId: leaseId,
        priority: 'HIGH',
      },
      {
        userId: lease.ownerId,
        type: 'LEASE',
        title: 'Lease Agreement Ready',
        message: `Lease agreement for "${lease.land.title}" is ready. Waiting for farmer signature.`,
        actionUrl: `/applications/${lease.id}`,
        entityType: 'LEASE',
        entityId: leaseId,
        priority: 'MEDIUM',
      },
    ];

    const result = await triggerBulkNotifications(notifications);
    return { 
      success: true, 
      sent: result.sent, 
      failed: result.failed 
    };
  } catch (error) {
    console.error('Failed to send lease notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

export async function notifyApplicationStatusChange(
  applicationId: string,
  _oldStatus: string,
  newStatus: string
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { land: true, farmer: true },
    });

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    const statusMessages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      APPROVED: {
        title: 'Application Approved',
        message: `Your application for "${application.land.title}" has been approved. Lease agreement will be sent soon.`,
        priority: 'HIGH',
      },
      REJECTED: {
        title: 'Application Not Selected',
        message: `Unfortunately, your application for "${application.land.title}" was not selected this time.`,
        priority: 'MEDIUM',
      },
      UNDER_REVIEW: {
        title: 'Application Under Review',
        message: `Your application for "${application.land.title}" is being reviewed by the landowner.`,
        priority: 'LOW',
      },
    };

    const msg = statusMessages[newStatus];
    if (!msg) {
      return { success: true, message: 'No notification needed for this status' };
    }

    return triggerNotification({
      userId: application.farmerId,
      type: 'APPLICATION',  
      title: msg.title,
      message: msg.message,
      actionUrl: `/applications/${applicationId}`,
      entityType: 'APPLICATION',
      entityId: applicationId,
      priority: msg.priority,
    });
  } catch (error) {
    console.error('Failed to send application status notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function notifyPaymentReceived(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: { include: { land: true, owner: true } },
        user: true,
      },
    });

    if (!payment || !payment.lease) {
      return { success: false, error: 'Payment or lease not found' };
    }

    return triggerNotification({
      userId: payment.lease.ownerId,
      type: 'PAYMENT',
      title: 'Payment Received',
      message: `Payment of Rs ${Number(payment.amount?.toNumber() ?? 0).toLocaleString('en-IN')} received for lease ending ${payment.leaseId?.slice(-8)}.`,
      actionUrl: `/applications/${payment.leaseId}`,
      entityType: 'PAYMENT',
      entityId: paymentId,
      priority: 'MEDIUM',
    });
  } catch (error) {
    console.error('Failed to send payment notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}