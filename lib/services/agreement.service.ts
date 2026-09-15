import {
  AgreementStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

import {
  AGREEMENT_TEMPLATE_VERSION,
  AgreementSnapshot,
} from "@/lib/agreements/agreement.types";

import { canTransitionAgreement } from "@/lib/agreements/agreement-state";

import { generateLeaseAgreementPdf } from "@/lib/agreements/agreement-generator";

import { LeaseAgreementStorage } from "@/lib/storage/lease-agreement.storage";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type AgreementActor = {
  id: string;
  role: UserRole | null;
};

export class AgreementService {
  private static assertActor(actor: AgreementActor): void {
    if (!actor?.id) {
      throw new AppError(
        "Unauthorized",
        401,
        "UNAUTHORIZED",
      );
    }
  }

  private static assertAccess(
    actor: AgreementActor,
    lease: {
      farmerId: string;
      ownerId: string;
    },
  ): void {
    this.assertActor(actor);

    if (
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return;
    }

    if (
      actor.id !== lease.farmerId &&
      actor.id !== lease.ownerId
    ) {
      throw new AppError(
        "You do not have access to this agreement",
        403,
        "FORBIDDEN",
      );
    }
  }

  private static async getLease(
    leaseId: string,
    db: DbClient = prisma,
  ) {
    const lease = await db.lease.findUnique({
      where: { id: leaseId },

      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        land: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lease) {
      throw new AppError(
        "Lease not found",
        404,
        "LEASE_NOT_FOUND",
      );
    }

    return lease;
  }

  static async getByLeaseId(
    leaseId: string,
    actor: AgreementActor,
  ) {
    const lease = await this.getLease(leaseId);

    this.assertAccess(actor, lease);

    const agreement =
      await prisma.leaseAgreement.findFirst({
        where: { leaseId },

        orderBy: {
          version: "desc",
        },

        include: {
          signatures: {
            orderBy: {
              signedAt: "asc",
            },

            select: {
              id: true,
              signerId: true,
              signerRole: true,
              signedAt: true,
              signatureHash: true,
            },
          },
        },
      });

    if (!agreement) {
      throw new AppError(
        "No agreement exists for this lease",
        404,
        "AGREEMENT_NOT_FOUND",
      );
    }

    return agreement;
  }

  static async getVersionHistory(
    leaseId: string,
    actor: AgreementActor,
  ) {
    const lease = await this.getLease(leaseId);

    this.assertAccess(actor, lease);

    return prisma.leaseAgreement.findMany({
      where: { leaseId },

      orderBy: {
        version: "desc",
      },

      include: {
        signatures: {
          select: {
            id: true,
            signerId: true,
            signerRole: true,
            signedAt: true,
            signatureHash: true,
          },
        },
      },
    });
  }

  private static buildSnapshot(
    lease: Awaited<
      ReturnType<typeof AgreementService.getLease>
    >,
    version: number,
  ): AgreementSnapshot {
    return {
      leaseId: lease.id,
      leaseVersion: lease.version,

      agreementVersion: version,
      templateVersion: AGREEMENT_TEMPLATE_VERSION,

      generatedAt: new Date().toISOString(),

      farmer: {
        id: lease.farmer.id,
        name: lease.farmer.name,
        email: lease.farmer.email,
      },

      owner: {
        id: lease.owner.id,
        name: lease.owner.name,
        email: lease.owner.email,
      },

      land: {
        id: lease.land.id,
        title: lease.land.title,
        location: null,
      },

      financials: {
        rent: lease.rent.toString(),

        securityDeposit:
          lease.securityDeposit?.toString() ?? null,

        grossContractValue:
          lease.grossContractValue?.toString() ?? null,

        platformFee:
          lease.platformFee?.toString() ?? null,

        netOwnerReceivable:
          lease.netOwnerReceivable?.toString() ?? null,
      },

      dates: {
        startDate: lease.startDate.toISOString(),
        endDate: lease.endDate.toISOString(),
      },

      source: lease.leaseSource,
    };
  }

  static async createFromLease(
    leaseId: string,
    actor: AgreementActor,
  ) {
    const lease = await this.getLease(leaseId);

    this.assertAccess(actor, lease);

    if (
      lease.lifecycleStatus === "TERMINATED" ||
      lease.lifecycleStatus === "COMPLETED"
    ) {
      throw new AppError(
        "Cannot generate an agreement for a terminal lease",
        400,
        "INVALID_LEASE_STATE",
      );
    }

    return prisma.$transaction(async (tx) => {
      const latest =
        await tx.leaseAgreement.findFirst({
          where: { leaseId },

          orderBy: {
            version: "desc",
          },
        });

      if (
        latest &&
        latest.status !== AgreementStatus.VOID &&
        latest.status !== AgreementStatus.EXPIRED
      ) {
        return latest;
      }

      const version = (latest?.version ?? 0) + 1;

      const snapshot =
        this.buildSnapshot(lease, version);

      return tx.leaseAgreement.create({
        data: {
          leaseId,
          version,
          status: AgreementStatus.DRAFT,
          templateVersion:
            AGREEMENT_TEMPLATE_VERSION,
          metadata:
            snapshot as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  static async createVersion(
    leaseId: string,
    actor: AgreementActor,
  ) {
    const lease = await this.getLease(leaseId);

    this.assertAccess(actor, lease);

    const latest =
      await prisma.leaseAgreement.findFirst({
        where: { leaseId },

        orderBy: {
          version: "desc",
        },
      });

    if (
      latest &&
      latest.status !== AgreementStatus.SIGNED &&
      latest.status !== AgreementStatus.VOID &&
      latest.status !== AgreementStatus.EXPIRED
    ) {
      throw new AppError(
        "An active agreement version already exists",
        409,
        "ACTIVE_AGREEMENT_EXISTS",
      );
    }

    const version = (latest?.version ?? 0) + 1;

    const snapshot =
      this.buildSnapshot(lease, version);

    return prisma.leaseAgreement.create({
      data: {
        leaseId,
        version,
        status: AgreementStatus.DRAFT,
        templateVersion:
          AGREEMENT_TEMPLATE_VERSION,
        metadata:
          snapshot as unknown as Prisma.InputJsonValue,
      },
    });
  }

  static async generateDocument(
    agreementId: string,
    actor: AgreementActor,
  ) {
    const agreement =
      await prisma.leaseAgreement.findUnique({
        where: {
          id: agreementId,
        },

        include: {
          lease: {
            include: {
              farmer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },

              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },

              land: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
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

    this.assertAccess(actor, agreement.lease);

    if (
      agreement.status !== AgreementStatus.DRAFT
    ) {
      throw new AppError(
        "Only draft agreements can be generated",
        400,
        "INVALID_AGREEMENT_STATE",
      );
    }

    const snapshot =
      agreement.metadata as unknown as AgreementSnapshot;

    const pdf =
      await generateLeaseAgreementPdf(snapshot);

    const hash = createHash("sha256")
      .update(Buffer.from(pdf))
      .digest("hex");

    const path =
      `agreements/${agreement.leaseId}/v${agreement.version}/${agreement.id}.pdf`;

    await LeaseAgreementStorage.upload(
      path,
      pdf,
    );

    return prisma.leaseAgreement.update({
      where: {
        id: agreement.id,
      },

      data: {
        documentUrl: path,
        documentHash: hash,
        status: AgreementStatus.PENDING_SIGNATURES,
        generatedAt: new Date(),
      },
    });
  }

  static async getDocumentUrl(
    agreementId: string,
    actor: AgreementActor,
  ) {
    const agreement =
      await prisma.leaseAgreement.findUnique({
        where: {
          id: agreementId,
        },

        include: {
          lease: {
            select: {
              farmerId: true,
              ownerId: true,
            },
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

    this.assertAccess(
      actor,
      agreement.lease,
    );

    if (!agreement.documentUrl) {
      throw new AppError(
        "Agreement document has not been generated",
        404,
        "DOCUMENT_NOT_FOUND",
      );
    }

    const url =
      await LeaseAgreementStorage.createSignedUrl(
        agreement.documentUrl,
      );

    return {
      url,
      expiresIn: 600,
      hash: agreement.documentHash,
    };
  }

  static async transition(
    agreementId: string,
    to: AgreementStatus,
    actor: AgreementActor,
  ) {
    const agreement =
      await prisma.leaseAgreement.findUnique({
        where: {
          id: agreementId,
        },

        include: {
          lease: true,
        },
      });

    if (!agreement) {
      throw new AppError(
        "Agreement not found",
        404,
        "AGREEMENT_NOT_FOUND",
      );
    }

    this.assertAccess(
      actor,
      agreement.lease,
    );

    if (
      to === AgreementStatus.SIGNED &&
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      throw new AppError(
        "SIGNED status can only be reached through the signing workflow",
        403,
        "SIGNATURE_WORKFLOW_REQUIRED",
      );
    }

    if (
      !canTransitionAgreement(
        agreement.status,
        to,
      )
    ) {
      throw new AppError(
        `Cannot transition agreement from ${agreement.status} to ${to}`,
        400,
        "INVALID_AGREEMENT_TRANSITION",
      );
    }

    return prisma.leaseAgreement.update({
      where: {
        id: agreementId,
      },

      data: {
        status: to,

        finalizedAt:
          to === AgreementStatus.SIGNED
            ? new Date()
            : undefined,
      },
    });
  }
}
