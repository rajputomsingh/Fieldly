# 🌾Fieldly

**Digital Farmland Leasing and Agricultural Intelligence Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://www.postgresql.org/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-Serverless-DC382D?logo=redis)](https://upstash.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk)](https://clerk.com/)
[![Pusher](https://img.shields.io/badge/Pusher-Realtime-300D4F?logo=pusher)](https://pusher.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active_Development-blue)](https://github.com/Om-singh-ui/Fieldly)
[![Architecture](https://img.shields.io/badge/Architecture-Event_Driven-black)](https://github.com/Om-singh-ui/Fieldly)
[![Scalability](https://img.shields.io/badge/Scalable-Yes-success)](https://github.com/Om-singh-ui/Fieldly)
[![PRs](https://img.shields.io/badge/PRs-Welcome-brightgreen)](CONTRIBUTING.md)

## App Preview

<div align="center">
  <img src="https://github.com/user-attachments/assets/a82f166a-8d5b-4926-9da1-9d370f37a30f" alt="Fieldly Dashboard" width="800" />
  <p><em>Intelligent Farmland Leasing With Fieldly</em></p>
</div>

<br />

<div align="center">
  <img src="https://github.com/user-attachments/assets/64c8d290-62ee-4d7a-b7d1-9c54676e60a1" alt="Fieldly Platform Interface" width="800" />
  <p><em>Agricultural Intelligence Platform Interface</em></p>
</div>

## Overview

Fieldly addresses structural inefficiencies in farmland leasing and agricultural decision-making. The platform combines verified identity systems, digital leasing infrastructure, intelligent matching, and a real-time agricultural insights engine into a unified ecosystem. It is designed to scale as an infrastructure layer for agricultural operations and rural financial services.

[![Realtime](https://img.shields.io/badge/Realtime-Enabled-purple)](https://github.com/Om-singh-ui/Fieldly)
[![Auth](https://img.shields.io/badge/Auth-Clerk-blueviolet)](https://clerk.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)
[![Caching](https://img.shields.io/badge/Caching-Redis-red)](https://redis.io/)
[![API](https://img.shields.io/badge/API-Type_Safe-green)](https://www.typescriptlang.org/)

### Mission

Build trusted digital infrastructure for farmland leasing, agricultural coordination, and rural intelligence systems.

## Problem Statement

| Challenge | Impact |
|---|---|
| Fragmented Leasing | Informal agreements cause disputes and operational inefficiencies |
| Trust Deficiency | No standardized verification for land parcels or participants |
| Information Asymmetry | Farmers lack access to actionable, data-driven insights |
| Low Asset Utilization | Landowners face operational opacity and underuse of land |
| Siloed Systems | No integrated platform combining leasing with intelligence |

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

[![Insights Engine](https://img.shields.io/badge/Insights-Enabled-orange)](https://github.com/Om-singh-ui/Fieldly)
[![Data Pipeline](https://img.shields.io/badge/Data-Pipeline-yellow)](https://github.com/Om-singh-ui/Fieldly)
[![Decision Engine](https://img.shields.io/badge/Decision-System-critical)](https://github.com/Om-singh-ui/Fieldly)

- Real-time agricultural intelligence from multi-source data
- Actionable recommendations for irrigation, planting, and harvesting
- Interactive data visualization with Recharts

### Scalable Architecture
- Real-time infrastructure with Pusher for live updates
- Rate limiting with Upstash Redis
- Type-safe database operations with Prisma ORM

## System Architecture

Fieldly is built as a modular, event-driven system designed for scalability and real-time data processing.

### Architecture Layers

| Layer | Purpose | Technologies |
|---|---|---|
| Client Layer | Web application for landowners and farmers | Next.js, React, TypeScript 5, Tailwind CSS 4 |
| Authentication | User identity and access management | Clerk |
| API Layer | Typed backend services and business logic | Next.js API Routes, Server Actions |
| Data Layer | Relational data with type-safe queries | PostgreSQL, Prisma ORM 6.19 |
| Realtime Layer | Event-driven synchronization | Pusher (WebSockets) |
| Caching & Rate Limiting | Performance and protection | Upstash Redis |
| File Storage | Document and media management | Supabase Storage |

### Core Modules

#### Identity and Verification Engine
- Multi-factor authentication
- Social login providers
- Role-based access control (Landowner, Farmer, Admin)
- Webhook integration via Svix for event synchronization

#### Leasing and Contract Engine
- Digital contract templates with React Hook Form
- Schema validation using Zod 4
- Real-time status updates via Pusher
- Toast notifications with Sonner

#### Matching and Allocation System
- Intelligent farmer-land matching algorithms
- Preference-based filtering
- Skills and crop compatibility assessment
- Animated UI transitions with Framer Motion

#### Insights Engine
- Irrigation optimization: soil moisture and weather integration
- Crop monitoring: real-time field condition tracking
- Data visualization: interactive charts with Recharts
- Animated statistics: number animations with React CountUp
- Real-time alerts: critical condition notifications via Pusher

#### Data Pipeline
- Weather data integration
- Satellite imagery processing (planned)
- Soil sensor data collection
- Scheduled jobs for data ingestion

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

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1 | React framework with App Router and Server Components |
| React | 19.2 | UI library with concurrent features |
| TypeScript | 5 | Type-safe development |
| Tailwind CSS | 4 | Utility-first CSS framework |
| Radix UI | Latest | Headless UI primitives |
| Framer Motion | 12.29 | Animation library |
| Lucide React | 0.563 | Icon library |
| Recharts | 3.7 | Composable charting library |
| React CountUp | 6.5 | Animated number transitions |
| Sonner | 2.0 | Toast notification system |
| Next Themes | 0.4 | Dark/light mode theming |
| React Hook Form | 7.71 | Form state management |
| Zod | 4.3 | Schema validation |

### Backend and Data

| Technology | Version | Purpose |
|---|---|---|
| Prisma | 6.19 | Type-safe ORM |
| PostgreSQL | Latest | Primary relational database |
| Supabase Storage | 2.99 | Media and document storage |
| Upstash Redis | 1.37 | Serverless Redis for caching and rate limiting |
| Pusher | 8.4 | Real-time WebSocket infrastructure |
| Svix | 1.84 | Webhook management and delivery |

### Authentication

| Technology | Version | Purpose |
|---|---|---|
| Clerk | 6.37 | Authentication and user management |

### State Management

| Technology | Version | Purpose |
|---|---|---|
| Zustand | 5.0 | Lightweight client-side state management |
| TanStack React Query | 5.97 | Server state and data fetching |

### Developer Infrastructure

[![Code Style](https://img.shields.io/badge/Code%20Style-Prettier-F7B93E)](https://prettier.io/)
[![Lint](https://img.shields.io/badge/Lint-ESLint-4B32C3)](https://eslint.org/)
[![Type Safety](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-black)](https://github.com/features/actions)

| Technology | Version | Purpose |
|---|---|---|
| ESLint | 9 | Code linting |
| Prettier | 3.8 | Code formatting |
| Husky | 9.1 | Git hooks |
| Lint Staged | 16.4 | Pre-commit file linting |


## Core Dependencies

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "typescript": "^5",
  "tailwindcss": "^4",
  "prisma": "^6.19.0",
  "clerk": "^6.37.0",
  "pusher": "^8.4.0",
  "zustand": "^5.0.0",
  "recharts": "^3.7.0",
  "react-hook-form": "^7.71.0",
  "zod": "^4.3.0",
  "framer-motion": "^12.29.0",
  "sonner": "^2.0.0",
  "lucide-react": "^0.563.0"
}
```

## ⚡Installation & Setup

### Clone Repository

```bash
git clone https://github.com/Om-singh-ui/Fieldly.git
cd Fieldly
```

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

Application will be available at:

```
http://localhost:3000
```