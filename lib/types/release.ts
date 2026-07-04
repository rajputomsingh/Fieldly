// lib/types/release.ts
export interface ReleaseResponse {
  version: string;
  name: string;
  url: string;
  publishedAt: string;
  prerelease: boolean;
}