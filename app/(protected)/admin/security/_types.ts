// app/(protected)/admin/security/_types.ts
export interface SecurityAlert {
  id: string;
  type: string;
  severity: "HIGH" | "CRITICAL" | "MEDIUM" | "LOW";
  message: string;
  createdAt: string;
}

export interface WhitelistedIP {
  ip: string;
  description?: string;
  addedAt: string;
  addedBy?: string;
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface RateLimitEndpoint {
  maxRequests: number;
  windowSeconds: number;
  enabled: boolean;
}

export interface RateLimitConfig {
  [endpoint: string]: RateLimitEndpoint;
}

export interface ActiveRateLimit {
  key: string;
  count: number;
  resetAt: string;
}

export interface RateLimitViolation {
  id: string;
  type: string;
  ipAddress: string;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  admin: {
    name: string;
    email: string;
    role: string;
  };
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: string;
  expiresAt: string;
  lastActive: string;
  isRevoked: boolean;
  isActive: boolean;
  isCurrent?: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SecurityStats {
  activeAlerts: number;
  whitelistedIPs: number;
  activeSessions: number;
  rateLimitViolations: number;
}

export type SecurityTab = "overview" | "alerts" | "ip-whitelist" | "rate-limit" | "sessions";