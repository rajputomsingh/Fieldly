# 🌾 Fieldly

> Digital Farmland Leasing & Agricultural Intelligence Platform

Fieldly is building trusted digital infrastructure for farmland leasing, agricultural operations, and rural coordination.

From land discovery and farmer onboarding to lease management and marketplace intelligence, Fieldly streamlines agricultural land operations through a modern digital platform.

[![Release](https://img.shields.io/badge/Release-v0.6.0--beta-blue)](../../releases)
[![Codename](https://img.shields.io/badge/Codename-Catalyst-purple)](../../releases)
[![Roadmap](https://img.shields.io/badge/Next-Vanguard-success)](../../milestones)
[![Status](https://img.shields.io/badge/Status-Active-success)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?logo=github-actions)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## App Preview

<div align="center">
  <img src="https://github.com/user-attachments/assets/a82f166a-8d5b-4926-9da1-9d370f37a30f" alt="Fieldly Dashboard" width="800" />
  <p><em>Intelligent Farmland Leasing With Fieldly</em></p>
</div>

<div align="center">
  <img src="https://github.com/user-attachments/assets/64c8d290-62ee-4d7a-b7d1-9c54676e60a1" alt="Fieldly Platform Interface" width="800" />
  <p><em>Agricultural Intelligence Platform Interface</em></p>
</div>

## Overview

Agricultural land leasing remains heavily fragmented, relying on informal agreements, manual verification processes, and disconnected communication channels.

Fieldly provides a unified platform that enables:

- Verified farmer and landowner onboarding
- Digital farmland discovery
- Marketplace-driven land leasing
- Application and bidding workflows
- Administrative governance tools
- Real-time notifications and engagement systems
- Agricultural intelligence and operational insights

The platform is designed as a scalable foundation for the future of agricultural commerce.

## Mission

Build trusted digital infrastructure for farmland leasing, agricultural coordination, and rural intelligence systems.

## Status

**Current Release:** v0.6.0-beta — Catalyst  
**Next Milestone:** Vanguard (v0.7.0-beta)  
**Development Status:** Active  

**Road to Production:** Genesis → Atlas → Nexus → Forge → Sentinel → Catalyst → Vanguard → Meridian → Horizon → Frontier

## Product Evolution

Fieldly is developed through milestone-driven releases inspired by modern SaaS engineering practices.

| Version | Codename | Focus |
|----------|-----------|--------|
| v0.1.0-alpha | Genesis | Authentication & Onboarding |
| v0.2.0-alpha | Atlas | Marketplace Foundation |
| v0.3.0-alpha | Nexus | Applications, Notifications & Administration |
| v0.4.0-beta | Forge | Infrastructure & Deployment |
| v0.5.0-beta | Sentinel | Security & Governance |
| v0.6.0-beta | Catalyst | Marketplace Refinement & UX |
| v0.7.0-beta | Vanguard | Verification, Leasing & Payments |
| v0.8.0-beta | Meridian | Marketplace Intelligence |
| v0.9.0-rc.1 | Horizon | Production Hardening |
| v1.0.0 | Frontier | Public Production Release |

## Solution

Fieldly provides a comprehensive ecosystem that transforms agricultural land management:

### Verified Marketplace
- Digital identity verification for landowners and farmers via Clerk
- Land parcel validation and documentation
- Trust scoring and reputation systems

### End-to-End Digital Leasing
- Automated contract generation and management
- Real-time updates via Pusher WebSockets
- Digital workflows with React Hook Form and Zod validation

### Modular Insights Engine
- Real-time agricultural intelligence from multi-source data
- Actionable recommendations for irrigation, planting, and harvesting
- Interactive data visualization with Recharts

### Scalable Architecture
- Real-time infrastructure with Pusher for live updates
- Rate limiting with Upstash Redis
- Type-safe database operations with Prisma ORM

<p align="center">
  <img
    src="/public/architecture.png"
    alt="Fieldly High-Level Architecture"
    width="100%"
  />
</p>

## Features

### For Farmers

| Feature | Description |
|---|---|
| Land Discovery | Search and filter verified farmland listings |
| Digital Applications | Submit and track lease applications with real-time status |
| Agricultural Intelligence | Interactive dashboards with Recharts visualizations |
| Field Monitoring | Track performance metrics and conditions |
| Profile Management | Secure identity management via Clerk |

### For Landowners

| Feature | Description |
|---|---|
| Asset Management | List and manage multiple land parcels |
| Farmer Verification | Vet and onboard qualified farmers |
| Lease Management | End-to-end leasing workflow automation |
| Utilization Analytics | Track land use with animated statistics |
| Revenue Optimization | Data-driven pricing recommendations |

### Platform Intelligence

| Capability | Status |
|---|---|
| Matching Engine | Active |
| Real-time Notifications | Active (Pusher) |
| Data Visualization | Active (Recharts) |
| Rate Limiting | Active (Upstash) |
| File Storage | Active (Supabase) |
| Risk Scoring | Planned |
| Yield Prediction | Planned |

## Roadmap

### Vanguard (v0.7.0-beta)
- Identity verification
- Lease agreement workflows
- Payment infrastructure
- Security deposits

### Meridian (v0.8.0-beta)
- Advanced marketplace search
- Recommendation engine
- Marketplace intelligence
- Analytics dashboards

### Horizon (v0.9.0-rc.1)
- Security hardening
- Performance optimization
- Monitoring and observability
- Release readiness

### Frontier (v1.0.0)
- Public production launch
- Revenue infrastructure
- Complete leasing lifecycle
- Marketplace operations platform

## ⚡Installation & Setup

### Clone Repository

```bash
git clone https://github.com/rajputomsingh/Fieldly.git
cd Fieldly

### Install Dependencies

```bash
# Install dependencies using pnpm (recommended)
pnpm install
```

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
