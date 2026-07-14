// types/land.types.ts
export interface Land {
  id: string;
  title: string;
  size: number;
  landType: string;
  village: string | null;
  district: string | null;
  state: string | null;
  minLeaseDuration: number;
  maxLeaseDuration: number;
  expectedRentMin: number | null;
  expectedRentMax: number | null;
  allowedCropTypes: string[];
  isActive: boolean;
  isArchived: boolean;
  landownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
