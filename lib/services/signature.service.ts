// lib/services/signature.service.ts
import {
  AgreementStatus,
  LeaseLifecycleStatus,
  UserRole,
} from "@prisma/client";

import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { LeaseService, LEASE_EVENTS } from "./lease.service";

export type SignatureActor = {
  id: string;
  role: UserRole | null;
  ipAddress?: string;
  userAgent?: string;
};

export class SignatureService {
  // --------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------

  private static getExpectedSignerRole(
    lease: { farmerId: string; ownerId: string },
    actorId: string,
  ): UserRole {
    if (actorId === lease.farmerId) return UserRole.FARMER;
    if (actorId === lease.ownerId) return UserRole.LANDOWNER;

    throw new AppError(
      "You are not a party to this lease",
      403,
      "FORBIDDEN",
    );
  }

  private static assertSignatureReader(
    actor: SignatureActor,
    lease: { farmerId: string; ownerId: string },
  ): void {
    const isAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;

    if (isAdmin) return;

    if (actor.id !== lease.farmerId && actor.id !== lease.ownerId) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
  }

  // --------------------------------------------------------
  // READ — list signatures for an agreement
  // --------------------------------------------------------

  static async getSignatures(
    agreementId: string,
    actor: SignatureActor,
  ) {
    const agreement = await prisma.leaseAgreement.findUnique({
      where: { id: agreementId },
      include: {
        lease: {
          select: { farmerId: true, ownerId: true },
        },
        signatures: {
          orderBy: { signedAt: "asc" },
        },
      },
    });

    if (!agreement) {
      throw new AppError(
        "Agreement not found",
        404,
        "AGREEMENT_NOT_FOUND",
      );
    }

    this.assertSignatureReader(actor, agreement.lease);

    return agreement.signatures;
  }

  // --------------------------------------------------------
  // SIGN — one party signs the agreement
  // --------------------------------------------------------
  //
  // Design:
  //   1. All reads and calculations happen OUTSIDE the transaction.
  //   2. The transaction contains only the three writes it needs:
  //        a) create LeaseSignature
  //        b) update LeaseAgreement
  //        c) conditionally update Lease + write LeaseEvent
  //   3. Transaction timeout is set explicitly so slow dev builds
  //      do not kill the transaction mid-flight.

  static async sign(
    agreementId: string,
    actor: SignatureActor,
  ) {
    if (!actor.id) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (
      actor.role !== UserRole.FARMER &&
      actor.role !== UserRole.LANDOWNER
    ) {
      throw new AppError(
        "Only farmer or landowner can sign",
        403,
        "SIGNER_ROLE_REQUIRED",
      );
    }

    // ---- 1. READ (outside transaction) ----

    const agreement = await prisma.leaseAgreement.findUnique({
      where: { id: agreementId },
      include: {
        lease: {
          select: {
            id: true,
            farmerId: true,
            ownerId: true,
            lifecycleStatus: true,
          },
        },
        signatures: true,
      },
    });

    if (!agreement) {
      throw new AppError(
        "Agreement not found",
        404,
        "AGREEMENT_NOT_FOUND",
      );
    }

    if (
      agreement.status !== AgreementStatus.PENDING_SIGNATURES &&
      agreement.status !== AgreementStatus.PARTIALLY_SIGNED
    ) {
      throw new AppError(
        `Agreement cannot be signed while ${agreement.status}`,
        400,
        "AGREEMENT_NOT_SIGNABLE",
      );
    }

    const signerRole = this.getExpectedSignerRole(
      agreement.lease,
      actor.id,
    );

    if (signerRole !== actor.role) {
      throw new AppError(
        "Signer role does not match lease party",
        403,
        "INVALID_SIGNER_ROLE",
      );
    }

    if (agreement.signatures.some((s) => s.signerId === actor.id)) {
      throw new AppError(
        "You have already signed this agreement",
        409,
        "ALREADY_SIGNED",
      );
    }

    // ---- 2. COMPUTE (outside transaction) ----

    const signedAt = new Date();

    const signatureHash = createHash("sha256")
      .update(
        [
          agreement.id,
          agreement.documentHash ?? "",
          actor.id,
          signedAt.toISOString(),
        ].join(":"),
      )
      .digest("hex");

    const farmerWillHaveSigned =
      agreement.signatures.some(
        (s) => s.signerId === agreement.lease.farmerId,
      ) || actor.id === agreement.lease.farmerId;

    const ownerWillHaveSigned =
      agreement.signatures.some(
        (s) => s.signerId === agreement.lease.ownerId,
      ) || actor.id === agreement.lease.ownerId;

    const fullySigned = farmerWillHaveSigned && ownerWillHaveSigned;

    const nextAgreementStatus = fullySigned
      ? AgreementStatus.SIGNED
      : AgreementStatus.PARTIALLY_SIGNED;

    let nextLeaseStatus: LeaseLifecycleStatus | null = null;

    if (fullySigned) {
      nextLeaseStatus = LeaseLifecycleStatus.PENDING_PAYMENT;
    } else if (farmerWillHaveSigned) {
      nextLeaseStatus = LeaseLifecycleStatus.PENDING_OWNER_SIGNATURE;
    } else if (ownerWillHaveSigned) {
      nextLeaseStatus = LeaseLifecycleStatus.PENDING_FARMER_SIGNATURE;
    }

    const leaseNeedsTransition =
      nextLeaseStatus !== null &&
      nextLeaseStatus !== agreement.lease.lifecycleStatus;

    // ---- 3. WRITE (fast, single transaction) ----

    return prisma.$transaction(
      async (tx) => {
        // (a) create the signature
        const signature = await tx.leaseSignature.create({
          data: {
            agreementId,
            signerId: actor.id,
            signerRole,
            signedAt,
            signatureHash,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
          },
        });

        // (b) update agreement status
        const updatedAgreement = await tx.leaseAgreement.update({
          where: { id: agreementId },
          data: {
            status: nextAgreementStatus,
            finalizedAt: fullySigned ? signedAt : undefined,
          },
          include: { signatures: true },
        });

        // (c) conditional lease lifecycle transition + audit event
        if (leaseNeedsTransition && nextLeaseStatus) {
          await tx.lease.update({
            where: { id: agreement.lease.id },
            data: { lifecycleStatus: nextLeaseStatus },
          });

          await LeaseService.recordEvent(tx, {
            leaseId: agreement.lease.id,
            actorId: actor.id,
            type: LEASE_EVENTS.TRANSITIONED,
            metadata: {
              from: agreement.lease.lifecycleStatus,
              to: nextLeaseStatus,
              source: "SIGNATURE_WORKFLOW",
              farmerSigned: farmerWillHaveSigned,
              ownerSigned: ownerWillHaveSigned,
            },
          });
        }

        return {
          signature,
          agreement: updatedAgreement,
          fullySigned,
        };
      },
      {
        maxWait: 10_000,
        timeout: 20_000,
        isolationLevel: "ReadCommitted",
      },
    );
  }

  // --------------------------------------------------------
  // VERIFY — recompute and compare a stored signature hash
  // --------------------------------------------------------

  static async verify(signatureId: string) {
    const signature = await prisma.leaseSignature.findUnique({
      where: { id: signatureId },
      include: { agreement: true },
    });

    if (!signature) {
      throw new AppError(
        "Signature not found",
        404,
        "SIGNATURE_NOT_FOUND",
      );
    }

    if (!signature.signatureHash || !signature.agreement.documentHash) {
      return {
        valid: false,
        reason: "Missing cryptographic material",
      };
    }

    const expected = createHash("sha256")
      .update(
        [
          signature.agreementId,
          signature.agreement.documentHash,
          signature.signerId,
          signature.signedAt.toISOString(),
        ].join(":"),
      )
      .digest("hex");

    return {
      valid: expected === signature.signatureHash,
      signatureId,
      agreementId: signature.agreementId,
    };
  }
}