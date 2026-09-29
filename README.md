# 🌾 Fieldly

> Digital infrastructure for farmland discovery, leasing, bidding, and lease execution.

Fieldly is a workflow-driven platform for connecting farmers and landowners through a digital farmland marketplace and managing the leasing lifecycle.

From land discovery and applications to bidding, lease agreements, signatures, payments, and realtime notifications, Fieldly brings the core farmland leasing workflow into a single platform.

[![Release](https://img.shields.io/badge/Release-v0.7.0--beta-blue)](../../releases)
[![Status](https://img.shields.io/badge/Status-Beta-success)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com/)
[![Pusher](https://img.shields.io/badge/Realtime-Pusher-300D4F)](https://pusher.com/)
[![Redis](https://img.shields.io/badge/Cache-Upstash_Redis-DC382D?logo=redis)](https://upstash.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE.md)

## Product Preview

  <div align="center">
    <img src="https://github.com/user-attachments/assets/4a2b7ddc-d866-4c16-ada9-ffe25ad79330" alt="Fieldly Dashboard" width="800" />
  </div>

  <div align="center">
    <img src="https://github.com/user-attachments/assets/51e41962-99b5-46f8-9be4-7d4a2ac25c74" alt="Fieldly Platform Interface" width="800" />
  </div>

## Product

Fieldly is a workflow-driven platform for digital farmland discovery, leasing, and marketplace operations.

The platform brings farmers and landowners into a unified workflow covering:

- Role-based farmer and landowner onboarding
- Farmland discovery and marketplace listings
- Land applications and bidding workflows
- Auction and settlement workflows
- Lease lifecycle management
- Digital agreements and signature workflows
- Payment-related lease progression
- Administrative governance and security controls
- Realtime notifications and user engagement

The system is implemented as a modular Next.js application with
domain-oriented services, PostgreSQL persistence through Prisma,
Redis-backed infrastructure, and integrations for authentication,
storage, realtime communication, email, and webhooks.

## Status

**Current Release:** `v0.7.0-beta — Vanguard`

**Development Status:** Beta

Fieldly is under active development. The current release focuses on the marketplace, leasing workflows, realtime notifications, administrative controls, and supporting infrastructure.

## Release History

| Version      | Codename | Focus                                        |
| ------------ | -------- | -------------------------------------------- |
| v0.1.0-alpha | Genesis  | Authentication & Onboarding                  |
| v0.2.0-alpha | Atlas    | Marketplace Foundation                       |
| v0.3.0-alpha | Nexus    | Applications, Notifications & Administration |
| v0.4.0-beta  | Forge    | Infrastructure & Deployment                  |
| v0.5.0-beta  | Sentinel | Security & Governance                        |
| v0.6.0-beta  | Catalyst | Marketplace Refinement & UX                  |
| v0.7.0-beta  | Vanguard | Verification, Leasing & Payments             |

## Architecture

  <p align="center">
    <img
      src="https://github.com/user-attachments/assets/b6fd11c6-665c-4602-b101-b8d4f6b7748a"
      alt="Fieldly High-Level Architecture"
      width="100%"
    />
  </p>

## Core Capabilities

### For Farmers

| Capability       | Description                           |
| ---------------- | ------------------------------------- |
| Marketplace      | Discover available farmland           |
| Applications     | Submit and track applications         |
| Bidding          | Participate in listing auctions       |
| Lease Management | Track agreements and lease state      |
| Notifications    | Receive application and lease updates |
| Profile          | Manage farmer information             |

### For Landowners

| Capability      | Description                             |
| --------------- | --------------------------------------- |
| Land Management | Create and manage land assets           |
| Listings        | Publish and manage marketplace listings |
| Applications    | Review incoming applications            |
| Auctions        | Configure and manage bidding            |
| Leases          | Manage lease execution and lifecycle    |
| Documents       | Manage supporting documents             |

### Platform

| Capability | Implementation |
|---|---|
| Authentication | Clerk |
| Authorization | Resource-level guards and permissions |
| Validation | Zod |
| Rate Limiting | Upstash Redis |
| Realtime | Pusher |
| File Storage | Supabase Storage |
| Data Visualization | Recharts |

## Roadmap

| Release  | Focus                                                                  |
| -------- | ---------------------------------------------------------------------- |
| `v0.8.x` | Marketplace discovery, search, recommendations, analytics              |
| `v0.9.x` | Security hardening, performance, observability, release readiness      |
| `v1.0.x` | Production release, revenue infrastructure, complete leasing lifecycle |

> Roadmap items are subject to change as implementation progresses.

## ⚡Installation & Setup

### Clone Repository

````bash
git clone https://github.com/rajputomsingh/Fieldly.git
cd Fieldly

### Install Dependencies

```bash
# Install dependencies using pnpm (recommended)
pnpm install
````

### Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

👉 Refer to the example file here:  
 **[.env.example](./.env.example)**

Update `.env` with required credentials:

- Database (PostgreSQL)
- Authentication (Clerk)
- Realtime (Pusher)
- Caching (Upstash Redis)
- Storage (Supabase, if used)

> The application will not run without valid environment variables.

### Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Apply database migrations (development)
pnpm prisma migrate dev
```

> Ensure your database is running before executing migrations.

### Run Development Server

```bash
# Start Next.js development server
pnpm dev
```

The application will be available at:

```
http://localhost:3000
```

### 🐳 Docker Setup

#### Development Environment

```bash
# Start development containers
docker compose -f docker-compose.dev.yml up --build

# Run with attached logs
docker compose -f docker-compose.dev.yml up --build --attach fieldly-app

# Stop containers
docker compose -f docker-compose.dev.yml down
```

#### Production Environment

```bash
# Build production containers
docker compose build

# Start production services
docker compose up -d

# Stop production services
docker compose down
```

## Community

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
