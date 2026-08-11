/*
  Warnings:

  - You are about to drop the column `token` on the `AdminSession` table. All the data in the column will be lost.
  - You are about to alter the column `proposedRent` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `Bid` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `depositAmount` on the `Land` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `expectedRentMin` on the `Land` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `expectedRentMax` on the `Land` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `basePrice` on the `LandListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `reservePrice` on the `LandListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `buyNowPrice` on the `LandListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `highestBid` on the `LandListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `bidIncrement` on the `LandListing` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `signedByFarmer` on the `Lease` table. All the data in the column will be lost.
  - You are about to drop the column `signedByOwner` on the `Lease` table. All the data in the column will be lost.
  - You are about to drop the column `terminationDate` on the `Lease` table. All the data in the column will be lost.
  - You are about to alter the column `rent` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `securityDeposit` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `terminationReason` column on the `Lease` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `escrowStatus` column on the `Lease` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `grossContractValue` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `netOwnerReceivable` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `platformFee` on the `Lease` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `depositAmount` on the `ListingTerms` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `gatewayFee` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `netAmount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `platformFee` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - A unique constraint covering the columns `[tokenHash]` on the table `AdminSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `AdminSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LandAvailabilityStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'LEASED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "LeaseLifecycleStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURES', 'PENDING_FARMER_SIGNATURE', 'PENDING_OWNER_SIGNATURE', 'PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'RENEWED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "LeasePaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "TerminationReason" AS ENUM ('MUTUAL_AGREEMENT', 'PAYMENT_DEFAULT', 'CONTRACT_BREACH', 'LAND_UNAVAILABLE', 'FORCE_MAJEURE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURES', 'PARTIALLY_SIGNED', 'SIGNED', 'VOID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SECURITY_DEPOSIT', 'RENT', 'LEASE_PAYMENT', 'PLATFORM_FEE', 'REFUND');

-- DropForeignKey
ALTER TABLE "AdminAction" DROP CONSTRAINT "AdminAction_adminId_fkey";

-- DropForeignKey
ALTER TABLE "AdminSession" DROP CONSTRAINT "AdminSession_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_landId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_listingId_fkey";

-- DropForeignKey
ALTER TABLE "AuctionEvent" DROP CONSTRAINT "AuctionEvent_listingId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_listingId_fkey";

-- DropForeignKey
ALTER TABLE "DisputeResolution" DROP CONSTRAINT "DisputeResolution_disputeId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_landId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- DropForeignKey
ALTER TABLE "FarmerProfile" DROP CONSTRAINT "FarmerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Land" DROP CONSTRAINT "Land_landownerId_fkey";

-- DropForeignKey
ALTER TABLE "LandListing" DROP CONSTRAINT "LandListing_landId_fkey";

-- DropForeignKey
ALTER TABLE "LandListing" DROP CONSTRAINT "LandListing_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "LandownerProfile" DROP CONSTRAINT "LandownerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_farmerId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_landId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ListingAnalytics" DROP CONSTRAINT "ListingAnalytics_listingId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_landId_fkey";

-- DropForeignKey
ALTER TABLE "ListingImage" DROP CONSTRAINT "ListingImage_listingId_fkey";

-- DropForeignKey
ALTER TABLE "ListingTerms" DROP CONSTRAINT "ListingTerms_listingId_fkey";

-- DropForeignKey
ALTER TABLE "MarketSubscription" DROP CONSTRAINT "MarketSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "SavedListing" DROP CONSTRAINT "SavedListing_listingId_fkey";

-- DropForeignKey
ALTER TABLE "SavedListing" DROP CONSTRAINT "SavedListing_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledNotification" DROP CONSTRAINT "ScheduledNotification_adminId_fkey";

-- DropForeignKey
ALTER TABLE "SoilReport" DROP CONSTRAINT "SoilReport_landId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropIndex
DROP INDEX "AdminSession_token_idx";

-- DropIndex
DROP INDEX "AdminSession_token_key";

-- DropIndex
DROP INDEX "LandListing_status_idx";

-- AlterTable
ALTER TABLE "AdminSession" DROP COLUMN "token",
ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "ips" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "proposedRent" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Land" ADD COLUMN     "availabilityStatus" "LandAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "depositAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "expectedRentMin" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "expectedRentMax" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "LandListing" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "basePrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "reservePrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "buyNowPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "highestBid" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "bidIncrement" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Lease" DROP COLUMN "signedByFarmer",
DROP COLUMN "signedByOwner",
DROP COLUMN "terminationDate",
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "escrowReleasedAt" TIMESTAMP(3),
ADD COLUMN     "farmerSignedAt" TIMESTAMP(3),
ADD COLUMN     "lifecycleStatus" "LeaseLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "ownerSignedAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "LeasePaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminatedBy" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "rent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "securityDeposit" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "terminationReason",
ADD COLUMN     "terminationReason" "TerminationReason",
DROP COLUMN "escrowStatus",
ADD COLUMN     "escrowStatus" "EscrowStatus",
ALTER COLUMN "grossContractValue" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "netOwnerReceivable" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "platformFee" SET DATA TYPE DECIMAL(8,2);

-- AlterTable
ALTER TABLE "ListingTerms" ALTER COLUMN "depositAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "gatewayFee" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "paymentType",
ADD COLUMN     "paymentType" "PaymentType" NOT NULL,
ALTER COLUMN "platformFee" SET DATA TYPE DECIMAL(8,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentId" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseAgreement" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "templateVersion" TEXT,
    "documentUrl" TEXT,
    "documentHash" TEXT,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseSignature" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerRole" "UserRole" NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "signatureHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeasePaymentSchedule" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "gracePeriodEnds" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeasePaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseEvent" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_eventId_key" ON "PaymentWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_eventType_idx" ON "PaymentWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_processedAt_idx" ON "PaymentWebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "LeaseAgreement_leaseId_idx" ON "LeaseAgreement"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseAgreement_status_idx" ON "LeaseAgreement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseAgreement_leaseId_version_key" ON "LeaseAgreement"("leaseId", "version");

-- CreateIndex
CREATE INDEX "LeaseSignature_agreementId_idx" ON "LeaseSignature"("agreementId");

-- CreateIndex
CREATE INDEX "LeaseSignature_signerId_idx" ON "LeaseSignature"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseSignature_agreementId_signerId_key" ON "LeaseSignature"("agreementId", "signerId");

-- CreateIndex
CREATE INDEX "LeasePaymentSchedule_leaseId_status_idx" ON "LeasePaymentSchedule"("leaseId", "status");

-- CreateIndex
CREATE INDEX "LeasePaymentSchedule_dueDate_status_idx" ON "LeasePaymentSchedule"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeasePaymentSchedule_leaseId_installmentNo_key" ON "LeasePaymentSchedule"("leaseId", "installmentNo");

-- CreateIndex
CREATE INDEX "LeaseEvent_leaseId_createdAt_idx" ON "LeaseEvent"("leaseId", "createdAt");

-- CreateIndex
CREATE INDEX "LeaseEvent_type_createdAt_idx" ON "LeaseEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_tokenHash_idx" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_isRevoked_idx" ON "AdminSession"("adminId", "isRevoked");

-- CreateIndex
CREATE INDEX "Application_listingId_idx" ON "Application"("listingId");

-- CreateIndex
CREATE INDEX "Application_farmerId_status_idx" ON "Application"("farmerId", "status");

-- CreateIndex
CREATE INDEX "Application_landId_status_idx" ON "Application"("landId", "status");

-- CreateIndex
CREATE INDEX "Application_landId_status_createdAt_idx" ON "Application"("landId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Application_listingId_status_idx" ON "Application"("listingId", "status");

-- CreateIndex
CREATE INDEX "Bid_listingId_status_amount_idx" ON "Bid"("listingId", "status", "amount" DESC);

-- CreateIndex
CREATE INDEX "Bid_farmerId_createdAt_idx" ON "Bid"("farmerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Bid_listingId_sequence_idx" ON "Bid"("listingId", "sequence");

-- CreateIndex
CREATE INDEX "Dispute_status_priority_createdAt_idx" ON "Dispute"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Land_availabilityStatus_idx" ON "Land"("availabilityStatus");

-- CreateIndex
CREATE INDEX "LandListing_landId_ownerId_idx" ON "LandListing"("landId", "ownerId");

-- CreateIndex
CREATE INDEX "LandListing_status_auctionStatus_endDate_idx" ON "LandListing"("status", "auctionStatus", "endDate");

-- CreateIndex
CREATE INDEX "Lease_lifecycleStatus_idx" ON "Lease"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "Lease_farmerId_lifecycleStatus_idx" ON "Lease"("farmerId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Lease_ownerId_lifecycleStatus_idx" ON "Lease"("ownerId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Lease_landId_lifecycleStatus_idx" ON "Lease"("landId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Lease_startDate_endDate_lifecycleStatus_idx" ON "Lease"("startDate", "endDate", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Lease_paymentStatus_lifecycleStatus_idx" ON "Lease"("paymentStatus", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_scheduleId_idx" ON "Payment"("scheduleId");

-- CreateIndex
CREATE INDEX "Payment_paymentType_idx" ON "Payment"("paymentType");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE INDEX "Payment_idempotencyKey_idx" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_razorpayOrderId_status_idx" ON "Payment"("razorpayOrderId", "status");

-- CreateIndex
CREATE INDEX "Payment_userId_status_createdAt_idx" ON "Payment"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Payment_leaseId_status_idx" ON "Payment"("leaseId", "status");

-- CreateIndex
CREATE INDEX "Payment_dueDate_status_idx" ON "Payment"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Payment_paymentType_status_idx" ON "Payment"("paymentType", "status");

-- CreateIndex
CREATE INDEX "User_isActive_deletedAt_idx" ON "User"("isActive", "deletedAt");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeResolution" ADD CONSTRAINT "DisputeResolution_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandownerProfile" ADD CONSTRAINT "LandownerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Land" ADD CONSTRAINT "Land_landownerId_fkey" FOREIGN KEY ("landownerId") REFERENCES "LandownerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandListing" ADD CONSTRAINT "LandListing_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandListing" ADD CONSTRAINT "LandListing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingTerms" ADD CONSTRAINT "ListingTerms_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionEvent" ADD CONSTRAINT "AuctionEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseAgreement" ADD CONSTRAINT "LeaseAgreement_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignature" ADD CONSTRAINT "LeaseSignature_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "LeaseAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignature" ADD CONSTRAINT "LeaseSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeasePaymentSchedule" ADD CONSTRAINT "LeasePaymentSchedule_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseEvent" ADD CONSTRAINT "LeaseEvent_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LeasePaymentSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAnalytics" ADD CONSTRAINT "ListingAnalytics_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LandListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSubscription" ADD CONSTRAINT "MarketSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilReport" ADD CONSTRAINT "SoilReport_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
