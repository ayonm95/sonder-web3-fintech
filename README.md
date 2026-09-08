# Sonder: Decentralized Music Streaming & FinTech Royalty Platform

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015%20(App%20Router)-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Foundry](https://img.shields.io/badge/Smart%20Contracts-Foundry%20%7C%20Solidity%200.8.36-red)](https://getfoundry.sh/)
[![Polygon Amoy](https://img.shields.io/badge/Network-Polygon%20Amoy%20(80002)-8247e5?logo=polygon)](https://amoy.polygonscan.com/)
[![Prisma ORM](https://img.shields.io/badge/Database-Prisma%20%7C%20PostgreSQL-2d3748?logo=prisma)](https://www.prisma.io/)
[![Compliance](https://img.shields.io/badge/Compliance-Sec%20194J%20TDS%20%7C%20DPDP%20Act%202023-emerald)](https://incometaxindia.gov.in/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Sonder** is a production-grade Web3 & FinTech music platform engineered to solve the transparency and settlement crisis in creator monetization.
>
> By uniting **real-time Web Audio streaming**, **GAAP-compliant double-entry ledgering**, **EIP-712 cryptographic rights attestation**, and **OpenZeppelin-compatible Merkle tree royalty settlement on the Polygon blockchain**, Sonder provides an end-to-end, mathematically verifiable music economy.
>
> **Status:** Live on **Polygon Amoy testnet, pending external audit** before any mainnet deployment.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Complete Technical Stack](#-complete-technical-stack)
3. [Smart Contracts & On-Chain Addresses](#-smart-contracts--on-chain-addresses)
4. [Core Architectural Workflows](#-core-architectural-workflows)
   - [1. Streaming Engine & Playback Telemetry](#1-streaming-engine--playback-telemetry)
   - [2. Creator Studio & EIP-712 Legal Rights Attestation](#2-creator-studio--eip-712-legal-rights-attestation)
   - [3. Double-Entry Financial Accounting (GAAP)](#3-double-entry-financial-accounting-gaap)
   - [4. Merkle Royalty Settlement & On-Chain Roots](#4-merkle-royalty-settlement--on-chain-roots)
   - [5. Anti-Fraud Playback Heuristics](#5-anti-fraud-playback-heuristics)
   - [6. DPDP Act 2023 Compliance & Privacy Vault](#6-dpdp-act-2023-compliance--privacy-vault)
5. [Getting Started & Installation](#-getting-started--installation)
   - [Prerequisites](#prerequisites)
   - [Environment Setup (`.env`)](#environment-setup-env)
   - [Database Synchronization](#database-synchronization)
   - [Smart Contract Deployment Script](#smart-contract-deployment-script)
6. [Automated Verification & Test Suite](#-automated-verification--test-suite)
7. [Security & Git Safety Considerations](#-security--git-safety-considerations)
8. [API Route Reference](#-api-route-reference)
9. [License & Acknowledgments](#-license--acknowledgments)

---

## 🏗 Architectural Overview

```
                                    +-----------------------------------------+
                                    |         Next.js 15 Client (React 19)    |
                                    |     Web Audio Player + MetaMask Wallet  |
                                    +--------------------+--------------------+
                                                         |
                               +-------------------------+-------------------------+
                               |                                                   |
                               v                                                   v
                     [ Listener Portal ]                                   [ Creator Studio ]
             - Lossless Audio Web Streams                          - Track Lifecycle State Machine
             - 8-Second Telemetry Heartbeats                       - Audio Fingerprinting
             - Fraud Risk Scoring Chip                             - EIP-712 Gasless Rights Attestation
                               |                                                   |
                               +-------------------------+-------------------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |     Next.js API Engine     |
                                           +--------------+-------------+
                                                          |
             +--------------------+-----------------------+-----------------------+--------------------+
             |                    |                       |                       |                    |
             v                    v                       v                       v                    v
      [ ledger.ts ]         [ merkle.ts ]           [ eip712.ts ]           [ fraud.ts ]         [ privacy.ts ]
    - Chart of Accounts   - Binary Merkle Tree    - Domain Separation     - Velocity Analysis  - k = 25 Suppression
    - Debit == Credit     - Sorted-Pair Hashing   - Typed Data Schema     - Loop Detection     - DPDP Consent Hash
    - 1% TDS Calculator   - Proof Generation      - PubKey Signer Recovery- 30s Rule Qualified - Art 12 Portability
             |                    |                       |                       |                    |
             +--------------------+-----------------------+-----------------------+--------------------+
                                                          |
                               +--------------------------+--------------------------+
                               |                                                     |
                               v                                                     v
                 +----------------------------+                        +----------------------------+
                 |    PostgreSQL Database     |                        |    Polygon Amoy Testnet    |
                 |     (Prisma ORM Client)    |                        |   (EVM Smart Contracts)    |
                 +----------------------------+                        +----------------------------+
                 - Complete Ledger History                             - SettlementManager.sol
                 - Creator & Track Metadata                            - CreatorRegistry.sol
                 - Playback Session Telemetry                          - Immutable 32-byte Roots
```

---

## 🛠 Complete Technical Stack

| Layer | Technologies | Purpose & Invariants |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15.1 (App Router)** & **React 19** | Server/Client components, SSR, dynamic caching, micro-animations. |
| **Styling & Design** | **Tailwind CSS v3**, **Lucide Icons**, **Canvas Confetti** | Responsive dark-mode glassmorphism UI with hardware-accelerated transitions. |
| **Audio Engine** | **HTML5 Audio / Web Audio API** | Lossless audio buffer streaming, reactive playback waveform, scrubbing controls. |
| **Database & ORM** | **PostgreSQL 16** via **Prisma ORM 6** | Relational integrity, foreign key constraints, `BigInt` financial storage in paise. |
| **Smart Contracts** | **Solidity 0.8.36**, **Foundry (Forge & Cast)** | Gas-optimized smart contracts, deployed and broadcast to Polygon Amoy. |
| **Web3 Client** | **Ethers.js v6**, **Injected MetaMask Provider** | EIP-712 structured data signing, Merkle leaf generation, ABI encoding. |
| **Accounting Standard** | **Double-Entry Bookkeeping** | Strict mathematical balance invariant: $\sum \text{Debits} - \sum \text{Credits} = 0$. |
| **Tax Compliance** | **Section 194J / 194O Income Tax Act** | Automatic 1.00% TDS withholding calculated and journaled on every distribution. |
| **Data Protection** | **Digital Personal Data Protection (DPDP) Act 2023** | $k$-anonymity audience suppression ($k=25$), purpose limitation, consent archives. |

---

## 🔗 Smart Contracts & On-Chain Addresses

> **Status:** Deployed on **Polygon Amoy testnet, pending external audit**.

The contracts are live on the **Polygon Amoy Testnet (Chain ID 80002)** and fully verifiable on the block explorer:

| Contract | Polygon Amoy Address | Verified Transaction Hash | Explorer Link |
| :--- | :--- | :--- | :--- |
| **SettlementManager** | `0xCc5A9aB4A844BF89a972F7Fb5830F0c2027a689b` | • Period #1: [`0xd1b80509...`](https://amoy.polygonscan.com/tx/0xd1b8050928034678f273f2f5ce92f6c7f1e526c15b8a7adfcbcaab81611688d0)<br>• Period #2: [`0xe478ffc7...`](https://amoy.polygonscan.com/tx/0xe478ffc7c722bf1a46f45d3823bd377e76e69ce62096a3c930a31c24643d019a) | [View on PolygonScan](https://amoy.polygonscan.com/address/0xCc5A9aB4A844BF89a972F7Fb5830F0c2027a689b) |
| **CreatorRegistry** | `0xc84edECB4DA294756Ac03B696F3e3f9ae78D5000` | Contract Deployed | [View on PolygonScan](https://amoy.polygonscan.com/address/0xc84edECB4DA294756Ac03B696F3e3f9ae78D5000) |
| **CreatorClaims** | `0xb61136b637f5d6fF87123A11C238622c83c27f51` | Contract Deployed | [View on PolygonScan](https://amoy.polygonscan.com/address/0xb61136b637f5d6fF87123A11C238622c83c27f51) |

* **SettlementManager.sol**: Commits periodic 32-byte Merkle roots, pool distributions, and IPFS ledger digests directly on-chain.
* **CreatorRegistry.sol**: Maps off-chain creator UUID hashes to verified payout wallets with zero on-chain PII and secure ownership transition.
* **CreatorClaims.sol**: Trustless on-chain sibling proof verification for direct wallet withdrawals against committed roots.

---

## ⚙️ Core Architectural Workflows

### 1. Streaming Engine & Playback Telemetry
* Audio is streamed through the persistent Web Audio context.
* Every playback session generates a unique cryptographic session token (`ses_...`).
* The client sends background telemetry pings every 8–10 seconds to `/api/playback-sessions/[token]/heartbeat`.
* Sessions must achieve **30 continuous seconds** of valid playback without cadence drift to earn "Qualified Listening" status for royalty allocation.

### 2. Creator Studio & EIP-712 Legal Rights Attestation
Under Section 19 of the **Indian Copyright Act 1957**, copyright assignments are legally void unless executed in writing specifying rights, territory, and term.
1. Master tracks advance through a 6-stage lifecycle: `DRAFT` ➔ `UPLOADED` ➔ `PROCESSING` ➔ `MODERATION` ➔ `PUBLISHED` ➔ `MONETIZED`.
2. Upon reaching `PUBLISHED`, the creator executes a **gasless EIP-712 typed signature** in MetaMask.
3. The domain separator binds to Polygon Amoy (`80002`).
4. The server receives `(message, signature)` and recovers the public address with `ethers.verifyTypedData`. When verified, the track is promoted to `MONETIZED`.

### 3. Double-Entry Financial Accounting (GAAP)
Financial integrity is managed by a strict Chart of Accounts:
* `1010`: Escrow & Cash Vault (Asset)
* `2010`: Creator Royalties Payable (Liability)
* `2020`: Statutory TDS Withholding Payable (Liability)
* `4010`: Subscription Pool Revenue (Revenue)
* `5010`: Royalty Distribution Expense (Expense)

All balances are recorded in integer subunits (paise) with mandatory idempotency keys and mathematical balance invariant verification:
$$\text{Total Debits} \equiv \text{Total Credits}$$

### 4. Merkle Royalty Settlement & On-Chain Roots
Rather than executing thousands of costly on-chain transactions, Sonder utilizes an off-chain compute, on-chain commit model:
1. Qualified stream counts are compiled into pro-rata creator allocations.
2. 1.00% TDS is deducted for tax compliance (Section 194O).
3. A deterministic, sorted-pair binary Merkle tree (`keccak256`) is constructed.
4. The operator commits the single 32-byte root hash on-chain to **Polygon Amoy** via `SettlementManager.sol`.
5. Creators receive a lightweight $O(\log N)$ sibling proof enabling instant, independent mathematical verification on [PolygonScan](https://amoy.polygonscan.com/).
6. Multi-cycle settlement management allows toggling between historical cycles with 1-click on-chain commitment triggers directly from the interactive UI.

### 5. Anti-Fraud Playback Heuristics
The platform evaluates every streaming session with real-time risk scoring (0–100):
* **Loop Farming**: Flags repetitive playback cycles with high frequency.
* **Cadence Drift**: Detects unnatural, script-injected heartbeat timing intervals.
* **Headless Detection**: Flags automated headless browsers.
Sessions scoring $\ge 50$ are flagged as `FRAUD_EXCLUDED` and disqualified from royalty pools.

### 6. DPDP Act 2023 Compliance & Privacy Vault
Engineered under the statutory provisions of the **Digital Personal Data Protection Act 2023**:
* **$k$-Anonymity Audience Guard ($k=25$)**: Audience cohorts with fewer than 25 listeners are suppressed at the database query layer (`[SUPPRESSED: < 25]`) to prevent de-anonymization linkage attacks.
* **Purpose Limitation**: Granular consent tracking for `TELEMETRY_ANALYTICS` and `PAYOUT_SETTLEMENT`.
* **Right to Data Portability (Art 12)**: 1-click machine-readable JSON export containing listener profiles, sessions, and consent histories.

---

## 🚀 Getting Started & Installation

### Prerequisites
* **macOS / Linux / Windows** (Node.js v20+ LTS)
* **pnpm** (`npm install -g pnpm`)
* **Foundry** (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
* **PostgreSQL Database** (Cloud Supabase, Neon, or local PostgreSQL)
* **MetaMask Browser Extension** (configured with Polygon Amoy testnet)

### Environment Setup (`.env`)
Copy the template and configure your credentials:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_POLYGON_CHAIN_ID="80002"
NEXT_PUBLIC_POLYGON_RPC="https://polygon-amoy.drpc.org"
AMOY_RPC_URL="https://polygon-amoy.drpc.org"
NEXT_PUBLIC_SETTLEMENT_MANAGER_ADDRESS="0xCc5A9aB4A844BF89a972F7Fb5830F0c2027a689b"
NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS="0xc84edECB4DA294756Ac03B696F3e3f9ae78D5000"
NEXT_PUBLIC_CREATOR_CLAIMS_ADDRESS="0xb61136b637f5d6fF87123A11C238622c83c27f51"
WALLET_ADDRESS="0xYourPublicWalletAddress"
PRIVATE_KEY="your_deployer_private_key_without_0x"
```

### Database Synchronization
Synchronize the schema and populate seeded catalog data:
```bash
# Push Prisma schema to PostgreSQL
pnpm db:push

# Seed master tracks, ledger accounts, and sample periods
pnpm db:seed
```

### Smart Contract Deployment Script
To deploy new smart contracts to Polygon Amoy, update `.env`, and launch the platform:
```bash
pnpm deploy:dev
# Or execute directly:
bash scripts/deploy-and-dev.sh
```

To run the platform without re-deploying contracts:
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Verification & Test Suite

Sonder includes 18 automated mathematical, cryptographic, and accounting engine tests:
```bash
pnpm test:engine
```

### Test Assertions Covered:
1. **Double-Entry Invariant**: Confirms $\sum \text{Debits} \equiv \sum \text{Credits}$; rejects unbalanced journal entries.
2. **Statutory Tax Integrity**: Validates Section 194J 1% TDS calculation down to the exact paise.
3. **Merkle Proof Verification**: Validates proof paths against OpenZeppelin verification standards; rejects tampered leaves.
4. **EIP-712 Signer Recovery**: Verifies public address derivation from structured typed signatures; rejects impostor addresses.
5. **Anti-Fraud Classification**: Confirms bot-farm session exclusion and qualified stream duration approval.

---

## 🔒 Security & Git Safety Considerations

Sonder maintains strict operational and cryptographic security standards:

* **Audit & Testnet Status**: Currently operational on **Polygon Amoy testnet, pending external audit**. Smart contracts are compiled with Foundry (Solidity 0.8.36), statically validated, and deployed on Amoy (Chain ID 80002). External third-party security audits and prolonged testnet soak will precede any mainnet real-funds release.

* **No Secrets in Git**: `.env`, `.env.local`, `broadcast/`, `cache/`, and private keys are strictly blacklisted in [`.gitignore`](.gitignore). Use [`.env.example`](.env.example) for environment configuration.
* **No On-Chain PII**: Smart contracts store exclusively 32-byte cryptographic digests (`bytes32`) and public wallet addresses.
* **Merkle Leaf Double Hashing**: Leaves are double-hashed using `keccak256(bytes.concat(keccak256(...)))` to neutralize second-preimage collision attacks.
* **EIP-712 Domain Separation**: Binds directly to Polygon Amoy `chainId: 80002` to prevent cross-chain signature replay attacks.
* **Non-Custodial Design**: The server never holds custody of artist earnings or copyright keys. Payout claims and copyright attestations are signed directly by artists via their non-custodial Web3 wallets.

For security disclosures, refer to [`SECURITY.md`](SECURITY.md).

---

## 🔌 API Route Reference

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tracks` | Retrieves master tracks with creator profile details |
| `POST` | `/api/tracks` | Registers a new master recording in `DRAFT` state |
| `POST` | `/api/tracks/[id]/state` | Advances track lifecycle (`UPLOADED`, `PROCESSING`, `PUBLISHED`) |
| `POST` | `/api/attestations/verify` | Validates EIP-712 signature and unlocks `MONETIZED` status |
| `GET` | `/api/playback-sessions` | Returns streaming telemetry sessions with fraud risk scores |
| `POST` | `/api/playback-sessions` | Initializes a playback session and returns a session token |
| `POST` | `/api/playback-sessions/[token]/heartbeat` | Ingests stream heartbeat, calculates risk score, and derives qualified streams |
| `GET` | `/api/ledger` | Returns chart of accounts, journal entries, and balance invariants |
| `POST` | `/api/ledger` | Posts double-entry transactions (subscriber inflows or creator payouts + TDS) |
| `GET` | `/api/settlement` | Lists settlement periods, committed Merkle roots, and allocations |
| `POST` | `/api/settlement` | Executes pro-rata royalty calculation and builds off-chain Merkle tree |
| `POST` | `/api/settlement/commit` | Broadcasts and permanently commits a calculated Merkle root on-chain to Polygon Amoy |
| `GET` | `/api/settlement/proof/[wallet]` | Fetches creator Merkle proof path and cryptographic leaf |
| `GET` | `/api/privacy` | Generates $k$-anonymity audience matrix ($k=25$) and consent history |
| `POST` | `/api/privacy` | Revokes consent or exports machine-readable DPDP user archive (JSON) |

---

## 📜 License & Acknowledgments

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

Developed as a showcase portfolio illustrating high-performance Web3 architecture, financial ledger invariants, and digital rights monetization.
