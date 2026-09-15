import { AgreementStatus } from "@prisma/client";

export const AGREEMENT_TRANSITIONS: Record<
  AgreementStatus,
  AgreementStatus[]
> = {
  [AgreementStatus.DRAFT]: [
    AgreementStatus.PENDING_SIGNATURES,
    AgreementStatus.VOID,
  ],

  [AgreementStatus.PENDING_SIGNATURES]: [
    AgreementStatus.PARTIALLY_SIGNED,
    AgreementStatus.SIGNED,
    AgreementStatus.VOID,
    AgreementStatus.EXPIRED,
  ],

  [AgreementStatus.PARTIALLY_SIGNED]: [
    AgreementStatus.SIGNED,
    AgreementStatus.VOID,
    AgreementStatus.EXPIRED,
  ],

  [AgreementStatus.SIGNED]: [
    AgreementStatus.VOID,
    AgreementStatus.EXPIRED,
  ],

  [AgreementStatus.VOID]: [],

  [AgreementStatus.EXPIRED]: [],
};

export function canTransitionAgreement(
  from: AgreementStatus,
  to: AgreementStatus,
): boolean {
  return AGREEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}
