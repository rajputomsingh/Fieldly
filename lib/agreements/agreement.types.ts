import { UserRole } from "@prisma/client";

export const AGREEMENT_TEMPLATE_VERSION = "v1.0";

export type AgreementSnapshot = {
  leaseId: string;
  leaseVersion: number;

  agreementVersion: number;
  templateVersion: string;

  generatedAt: string;

  farmer: {
    id: string;
    name: string | null;
    email: string | null;
  };

  owner: {
    id: string;
    name: string | null;
    email: string | null;
  };

  land: {
    id: string;
    title: string;
    location: string | null;
  };

  financials: {
    rent: string;
    securityDeposit: string | null;
    grossContractValue: string | null;
    platformFee: string | null;
    netOwnerReceivable: string | null;
  };

  dates: {
    startDate: string;
    endDate: string;
  };

  source: string;
};

export type AgreementTransition =
  | "PENDING_SIGNATURES"
  | "PARTIALLY_SIGNED"
  | "SIGNED"
  | "VOID"
  | "EXPIRED";

export type SignerContext = {
  id: string;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
};
