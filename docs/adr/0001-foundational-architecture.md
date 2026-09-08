# ADR 0001: Foundational Architecture & Technology Stack

**Status**: Accepted  
**Date**: 2026-09-08  
**Context**: Technical architecture alignment from the Phase 0/1 architectural review.

---

## 1. Monorepo Toolchain
- **Decision**: `pnpm` workspaces (v12) with `Turborepo`.
- **Rationale**: High performance, strict dependency resolution without phantom dependencies, native caching, fast TypeScript build pipelines, and seamless support across Next.js and NestJS.

## 2. Inter-Service Communication
- **Decision**: Hybrid REST/JSON at the edge and gRPC internally (`packages/proto`).
- **Rationale**: Web and admin clients interact via standard REST/JSON endpoints validated by Zod schemas. East-west microservice calls (auth verification, track lookup, playback session validation) leverage gRPC over HTTP/2 for type-safe, low-latency, and multiplexed execution.

## 3. Event Streaming Broker
- **Decision**: Redpanda locally (Kafka v2 API compatible) and AWS MSK in production; Node.js Kafka consumer groups for stream processing.
- **Rationale**: Redpanda provides a zero-JVM, single-binary C++ architecture that starts in <1s in Docker Compose with low memory overhead, while remaining 100% wire-compatible with production Kafka/MSK.

## 4. Database Isolation
- **Decision**: Distinct logical databases (`platform_identity`, `platform_catalog`, `platform_playback`, `platform_payments`, `platform_settlement`, `platform_payout`) on a shared PostgreSQL cluster with dedicated service users.
- **Rationale**: Enforces hard schema boundaries and eliminates cross-service SQL joins without incurring the high infrastructure costs of multi-instance RDS clusters during initial phases.

## 5. Layer 2 Blockchain & Account Abstraction
- **Decision**: Polygon PoS (Amoy testnet) with Biconomy Account Abstraction (ERC-4337).
- **Rationale**: Strong alignment with the Indian fiat/crypto ecosystem, negligible gas fees, and mature Paymaster infrastructure allowing gas sponsorship for creators and listeners.

## 6. Payment Rails & Payouts
- **Decision**: Gateway-agnostic adapter pattern with Razorpay + RazorpayX as the primary implementation.
- **Rationale**: Razorpay Subscriptions natively handles RBI e-mandate compliant UPI AutoPay. RazorpayX provides instant Penny Drop bank validation and IMPS/NEFT creator payouts. Section 194O 1% TDS is computed in the ledger at settlement.

## 7. Media Processing Pipeline
- **Decision**: Containerized worker (`BullMQ` + `Redis` + `FFmpeg` + `Chromaprint`) with MinIO S3-compatible storage locally.
- **Rationale**: Enables 100% parity between local testing and production ECS worker pools without relying on cloud-only transcoding services during early development.

## 8. CDN Edge Protection
- **Decision**: Edge-computed HMAC / signed cookies (CloudFront Functions / Cloudflare Workers).
- **Rationale**: Audio segments are CDN-cached; edge functions validate short-lived session tokens and expiration timestamps before serving HLS segments without hitting the origin media service.

## 9. Settlement Merkle Audit Trail
- **Decision**: IPFS (Pinata) pinned storage + S3 CDN mirror; root committed to `SettlementManager.sol`.
- **Rationale**: Gives complete transparency and independent verifiability for creator earnings without exposing audio files or PII on-chain.

## 10. Deployment Platform
- **Decision**: AWS ECS Fargate + Application Load Balancer via Terraform.
- **Rationale**: Serverless container execution with zero Kubernetes control plane maintenance, native IAM task roles, and low operational overhead for the team.
