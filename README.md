# Sonder: Creator-First Decentralized Royalty & Streaming Platform

[![Platform](https://img.shields.io/badge/Platform-Next.js%2015%20%7C%20React%2019-black)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%7C%20Prisma%20ORM-blue)](https://www.prisma.io/)
[![Engine](https://img.shields.io/badge/Container-OrbStack%20%28macOS%29-purple)](https://orbstack.dev/)
[![Web3](https://img.shields.io/badge/Web3-EIP--712%20%7C%20Merkle%20Trees%20%7C%20Polygon%20Amoy-teal)](https://ethereum.org/)
[![Compliance](https://img.shields.io/badge/Compliance-Sec%20194O%20TDS%20%7C%20DPDP%20Act%202023-emerald)](https://incometaxindia.gov.in/)

> **Sonder** is a creator-first decentralized music platform engineered to solve the hardest engineering, financial, and cryptographic challenges in creator monetization: **double-entry ledger bookkeeping**, **OpenZeppelin-compatible Merkle tree royalty settlements**, **non-repudiable EIP-712 rights attestations**, **server-authoritative stream fraud detection**, and **privacy-preserving k-anonymity analytics**.

---

## Table of Contents
1. [What's Real vs. Simulated](#-whats-real-vs-simulated)
2. [High-Level Architecture](#-high-level-architecture)
3. [Prerequisites & Environment](#-prerequisites--environment)
4. [Quickstart (OrbStack on macOS)](#-quickstart-orbstack-on-macos)
5. [How to Run Tests](#-how-to-run-tests)
6. [Core Workflows & App Guide](#-core-workflows--app-guide)
   - [1. Listener Playback & Telemetry Workflow (`/`)](#1-listener-playback--telemetry-workflow-)
   - [2. Creator Studio & EIP-712 Rights Attestation (`/studio`)](#2-creator-studio--eip-712-rights-attestation-studio)
   - [3. Double-Entry Ledger & Section 194O TDS (`/ledger`)](#3-double-entry-ledger--section-194o-tds-ledger)
   - [4. Cryptographic Merkle Settlement (`/settlement`)](#4-cryptographic-merkle-settlement-settlement)
   - [5. Anti-Fraud & Playback Diagnostics (`/fraud-diagnostics`)](#5-anti-fraud--playback-diagnostics-fraud-diagnostics)
   - [6. Fan CRM, k-Anonymity & Privacy Vault (`/privacy`)](#6-fan-crm-k-anonymity--privacy-vault-privacy)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Database Schema & Data Model](#-database-schema--data-model)
9. [Troubleshooting & Gotchas](#-troubleshooting--gotchas)

---

## ⚡ What's Real vs. Simulated

Sonder is designed to demonstrate **authentic production-grade thinking** on core differentiators while avoiding unnecessary enterprise bureaucracy (e.g. KYC vendors, real banking rails, banking gateway licenses):

| Component | Status | Implementation Details |
|---|---|---|
| **Double-Entry Financial Ledger** | **Real Logic** | Invariant assertion (`Total Debits == Total Credits`) in paise minor units, append-only entries, idempotency keys, and Section 194O 1% statutory TDS deduction. |
| **EIP-712 Rights Attestation** | **Real Cryptography** | Structured typed data schema under Indian Copyright Act Section 19. Signed via MetaMask (Amoy / Sepolia) or 1-click testnet key; verified server-side with `ethers.verifyTypedData`. |
| **Merkle Tree Royalty Settlement** | **Real Cryptography** | Deterministic sorted-pair binary Merkle tree (`keccak256`), leaf generation, and cryptographic proof verification matching OpenZeppelin `MerkleProof.sol`. |
| **Stream Fraud Detection** | **Real Scoring Engine** | Server-side heartbeat ingestion (every 8-10s), velocity checks, cadence drift detection, loop-farming penalty scoring, and qualified listening derivation (30s rule). |
| **k-Anonymity Privacy** | **Real Query Guard** | Direct database-query suppression (`[SUPPRESSED: < 25]`) to prevent re-identification attacks in listener analytics. |
| **Banking & Fiat Payouts** | **Simulated** | Synthetic escrow pool, Penny Drop bank verification, and simulated IMPS/UPI payouts. |
| **On-Chain Settlement Root Commit** | **Simulated Default (with Polygon Amoy)** | Root is computed and stored with real Polygon Amoy explorer link; contracts in `contracts/src` can be deployed via Foundry. |

---

## 🏗 High-Level Architecture

```
                                  +---------------------------------------+
                                  |           Client / Browser            |
                                  | (Next.js 15 App Router + Tailwind CSS)|
                                  +-------------------+-------------------+
                                                      |
                  +-----------------------------------+-----------------------------------+
                  |                                   |                                   |
                  v                                   v                                   v
        [ Listener Portal ]                 [ Creator Studio ]                  [ Financial Hub ]
     - Persistent Web Audio              - Lifecycle State Machine           - Double-Entry Journal
     - Heartbeat Emitter (8s)            - EIP-712 Rights Signing            - Sec 194O TDS Calculator
     - Real-Time Fraud Chip              - MetaMask / Testnet Key            - Debit == Credit Invariant
                  |                                   |                                   |
                  +-----------------------------------+-----------------------------------+
                                                      |
                                                      v
                                        +----------------------------+
                                        |      Next.js API Engine    |
                                        +--------------+-------------+
                                                       |
         +--------------------+------------------------+-----------------------+--------------------+
         |                    |                        |                       |                    |
         v                    v                        v                       v                    v
  [ ledger.ts ]         [ merkle.ts ]            [ eip712.ts ]           [ fraud.ts ]         [ privacy.ts ]
- 6-Account Chart     - Binary Tree Build     - Domain Separation     - Velocity Anomaly   - k = 25 Suppression
- Invariant Checker   - Sorted-pair Hashing   - Typed Data Schema     - Loop-Farm Flags    - DPDP Consent Hash
- 1% TDS Calculator   - Proof Generation      - Signer Recovery       - 30s Qualified Deriv- Data Export (Art 12)
         |                    |                        |                       |                    |
         +--------------------+------------------------+-----------------------+--------------------+
                                                       |
                                                       v
                                        +----------------------------+
                                        |    Prisma ORM Client       |
                                        +--------------+-------------+
                                                       |
                                                       v
                                        +----------------------------+
                                        |   PostgreSQL 16 Engine     |
                                        |    (Running in OrbStack)   |
                                        +----------------------------+
```

---

## 💻 Prerequisites & Environment

- **Operating System**: macOS (Apple Silicon or Intel)
- **Container Engine**: **[OrbStack](https://orbstack.dev/)** (drop-in, lightweight Docker replacement for macOS)
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: `pnpm` (v10+ supported via `pnpm-workspace.yaml`)
- **Web3 Wallet (Optional)**: MetaMask browser extension for testing interactive on-chain EIP-712 signing (a 1-click testnet key signer is also built-in).

---

## 🚀 Quickstart (OrbStack on macOS)

Follow these exact steps to boot the entire platform from a clean state:

### Step 1: Start OrbStack Daemon
```bash
orb start
```
Verify OrbStack is running:
```bash
orb status
# Output should show: Running
```

### Step 2: Start PostgreSQL Database Container
```bash
docker compose up -d
```
Verify container health:
```bash
docker compose ps
# Output: music-platform-postgres (postgres:16-alpine) ... Up (healthy) on 0.0.0.0:5432
```

### Step 3: Install Project Dependencies
```bash
pnpm install
```

### Step 4: Sync Database Schema & Generate Prisma Client
```bash
pnpm db:push
```
This maps the schema in `prisma/schema.prisma` directly to your OrbStack Postgres database.

### Step 5: Seed Realistic Catalog & Financial Data
```bash
pnpm db:seed
```
Seeds:
- Standard **Chart of Accounts** (1010, 2010, 2020, 3010, 4010, 5010)
- **4 Verified Indian Indie Artists** (Tarang, Ananya, KABIR, Meera & The Monsoon) with real Polygon Amoy addresses
- **6 Master Tracks** with functional audio preview streams and artwork
- **Initial Balanced Ledger Transactions** (Escrow subscription inflow & royalty expense distribution)
- **Settlement Period #1** with computed Merkle root: `0x211b0bc5a60c11614d3fe347989b1d3a9a9d5f5a56bb40b11317c8c5e88e4637`
- **Playback Sessions** (1 clean listening session, 1 flagged bot-farm loop anomaly)
- **DPDP Act 2023 Consent Records**

### Step 6: Launch Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 How to Run Tests

Sonder includes an automated test verification suite covering all mathematical, cryptographic, and fraud-detection invariants.

Run the test suite with:
```bash
pnpm test:engine
```

### What `test:engine` Validates (18 Test Assertions):
1. **Double-Entry Ledger Invariant**:
   - Asserts total system debits strictly equal total credits across all accounts in the database.
   - Verifies Section 194O 1% statutory TDS calculation down to the exact paise (`Gross == TDS + Net`).
   - Rejects intentionally unbalanced transactions (`Debit != Credit`) and asserts the ledger engine throws an invariant violation.
2. **Cryptographic Merkle Settlement**:
   - Generates OpenZeppelin-compatible Merkle tree root (`bytes32`).
   - Verifies each creator's audit proof (`bytes32[]`) cryptographically against the root.
   - Negative test: tampers with an allocation amount and confirms the verifier rejects the manipulated leaf.
3. **EIP-712 Rights Attestation**:
   - Constructs typed data payload and signs with an ephemeral ethers wallet.
   - Recovers the signer address server-side and validates exact match.
   - Negative test: verifies signature against a different (impostor) address and confirms rejection.
4. **Playback Fraud & Qualified Listening**:
   - Tests normal human playback stream: risk score `< 20/100`, qualified listening approved.
   - Tests synthetic bot cluster (rapid 500ms heartbeats + 15 repeats): risk score `> 50/100`, flags session as `FRAUD_EXCLUDED`, and disqualifies it from royalty allocation.

---

## 📱 Core Workflows & App Guide

### 1. Listener Playback & Telemetry Workflow (`/`)
1. Visit `http://localhost:3000`.
2. Browse the master catalog, filtered by genres (*Indian Electronica*, *Indie Folk*, *Ambient*, *Neo-Soul*).
3. Click the **Play button** on any release (e.g. *Monsoon Cybernetics*).
4. The persistent bottom audio bar will slide up and begin playing Web Audio.
5. In the bottom-right corner, observe the **Live Heartbeat Telemetry Chip**:
   - A pulsing green dot displays `HB #1 (ses_...)`.
   - The countdown shows `30s to qualify`.
   - Every 8 seconds, the client sends a background heartbeat to `/api/playback-sessions/[token]/heartbeat`.
   - Once 30 continuous seconds elapse without velocity anomalies, the status turns into **"Qualified Stream"** and increments the track's qualified minutes in the database.

---

### 2. Creator Studio & EIP-712 Rights Attestation (`/studio`)
1. Visit `http://localhost:3000/studio`.
2. **Ingest a New Master**:
   - Fill in Title, Genre, Duration, and Audio Stream URL.
   - Click **"Register Master in DRAFT State"**.
3. **Advance the Track Lifecycle State Machine**:
   - `DRAFT` ➔ Click **"Upload to Cloud"** ➔ `UPLOADED`.
   - `UPLOADED` ➔ Click **"Run HLS Transcode & Fingerprint"** ➔ `PROCESSING`.
   - `PROCESSING` ➔ Click **"Submit to Moderation"** ➔ `MODERATION_REVIEW`.
   - `MODERATION_REVIEW` ➔ Click **"Pass Moderation & Publish"** ➔ `PUBLISHED`.
4. **Sign Non-Repudiable EIP-712 Rights Attestation**:
   - When a track reaches `PUBLISHED`, click **"Sign EIP-712 Rights Attestation"**.
   - Review the legal warranty statement under Section 19 of the Indian Copyright Act 1957.
   - Click either **"Sign with MetaMask"** (for browser wallet) or **"Instant Testnet Key Signer"** (for 1-click testnet signing).
   - The signature is verified server-side via `ethers.verifyTypedData`.
   - Upon verification, the track immediately transitions to **`MONETIZED`**, unlocks royalty eligibility, and triggers a celebration animation!

---

### 3. Double-Entry Ledger & Section 194O TDS (`/ledger`)
1. Visit `http://localhost:3000/ledger`.
2. **Verify System Invariant**:
   - Inspect the top badge: `INVARIANT SATISFIED: DEBITS == CREDITS`.
   - Total debits and credits match to the exact single paisa (₹4,30,000.00).
3. **Inspect Chart of Accounts**:
   - `1010` Escrow & Cash Vault (Asset)
   - `2010` Creator Royalties Payable (Liability)
   - `2020` TDS Withholding Payable - Section 194O (Liability)
   - `4010` Subscriber Royalty Pool Revenue (Revenue)
   - `5010` Royalty Distribution Expense (Expense)
4. **Interactive Section 194O TDS Calculator**:
   - Type any gross royalty amount in the input box (e.g. ₹75,000).
   - Watch the live breakdown: 1.00% TDS (₹750) withheld for tax remittance, net ₹74,250 claimable.
5. **Live Transaction Posting Simulator**:
   - Click **"Subscriber Pool Inflow (+₹1,00,000)"**: Posts Debit 1010 / Credit 4010.
   - Click **"Creator Payout + TDS (+₹25,000)"**: Posts Debit 2010 (₹25,000) / Credit 1010 (₹24,750 net) / Credit 2020 (₹250 TDS).
   - Observe the live ledger journal log update instantly with unique transaction IDs and idempotency keys.

---

### 4. Cryptographic Merkle Settlement (`/settlement`)
1. Visit `http://localhost:3000/settlement`.
2. **Inspect Period #1 Root**:
   - View the committed Merkle Root (`0x211b0bc5a60c...`) and the Polygon Amoy blockchain verification badge.
3. **Interactive Proof Verifier**:
   - Select any seeded creator from the dropdown (e.g. *Tarang* or *Ananya*).
   - The engine extracts:
     - **Leaf Hash**: `keccak256(abi.encodePacked(address, netAmount, period))`
     - **Audit Proof Path**: Array of sibling `bytes32` hashes.
   - Reconstructs the Merkle root client-side using `verifyAllocationProof`.
   - Displays the verdict: **"CRYPTOGRAPHICALLY VALID: Proof accurately reconstructs root"**.
4. **Trigger On-Demand Settlement**:
   - Click **"Trigger Settlement Period Run"**.
   - Aggregates all current qualified listening minutes, allocates pro-rata shares, computes 1% TDS, builds a brand-new binary Merkle tree, and generates proof elements for all creators in the database.

---

### 5. Anti-Fraud & Playback Diagnostics (`/fraud-diagnostics`)
1. Visit `http://localhost:3000/fraud-diagnostics`.
2. **Review Anti-Fraud Heuristics**:
   - Multi-signal scoring covers **Loop Farming**, **Velocity Anomalies**, **Heartbeat Drift**, and **High Concurrency**.
3. **Examine Live Feed**:
   - Observe human listening streams with low risk scores (`0/100` or `8/100`).
   - Observe the seeded bot-farm session (`ses_bot_farm_flagged_loop_cluster_99`):
     - Risk Score: **`85/100` (CRITICAL)**.
     - Status: **`FRAUD_EXCLUDED`**.
     - Signal: *Suspicious loop activity: 14 consecutive plays in under 60 minutes | Unnatural heartbeat delivery intervals*.
4. **Audit Session Events**:
   - Click **"Events Trace"** on any session to inspect the exact timeline of `START` and `HEARTBEAT` pings with millisecond delta intervals.

---

### 6. Fan CRM, k-Anonymity & Privacy Vault (`/privacy`)
1. Visit `http://localhost:3000/privacy`.
2. **Query-Layer k-Anonymity Guard ($k = 25$)**:
   - Review the demographic audience cohorts table.
   - High-volume cohorts (*Bengaluru* with 840, *Mumbai* with 620) display aggregate statistics.
   - Low-volume cohorts (*Shillong* with 19 listeners, *Goa* with 14 listeners) are **strictly suppressed** at the database query layer:
     - Listener Count: `[SUPPRESSED: < 25]`
     - Listening Duration: `[DATA REDACTED]`
     - Prevents de-anonymization and linkage attacks.
3. **Immutable DPDP Consent Records**:
   - View registered user consent records under Digital Personal Data Protection Act 2023 guidelines.
   - Click **"Revoke"** to exercise statutory right to withdraw consent.
4. **Right to Data Portability (DPDP Art 12 / GDPR Art 20)**:
   - Click **"Export Personal Data (DPDP Art 12)"**.
   - Downloads a complete, machine-readable JSON bundle containing user profile, playback events, consent audit history, and royalty claim records.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Key Payload / Query |
|---|---|---|---|
| `GET` | `/api/tracks` | Lists master tracks with creator profile | `?state=MONETIZED` |
| `POST` | `/api/tracks` | Registers a new track in `DRAFT` state | `{ title, genre, audioUrl, durationSeconds }` |
| `POST` | `/api/tracks/[id]/state` | Advances track lifecycle state | `{ targetState: 'UPLOADED' }` |
| `POST` | `/api/attestations/verify` | Verifies EIP-712 signature & advances to `MONETIZED` | `{ trackId, message, signature, expectedSigner }` |
| `GET` | `/api/playback-sessions` | Fetches sessions with fraud risk score | `?limit=50` |
| `POST` | `/api/playback-sessions` | Initiates new playback session | `{ trackId, userId }` |
| `POST` | `/api/playback-sessions/[token]/heartbeat` | Ingests playback heartbeat & computes fraud | `{ positionSeconds: 15 }` |
| `GET` | `/api/ledger` | Returns chart of accounts, entries, & invariant status | None |
| `POST` | `/api/ledger` | Simulates subscriber deposit or creator payout + TDS | `{ action: 'SIMULATE_CREATOR_PAYOUT', amountInr: '25000' }` |
| `GET` | `/api/settlement` | Lists settlement periods, roots, & allocations | None |
| `POST` | `/api/settlement` | Builds new period Merkle tree off-chain | `{ totalPoolInr: '250000' }` |
| `GET` | `/api/settlement/proof/[wallet]` | Looks up creator leaf, proof `bytes32[]`, & validation | None |
| `GET` | `/api/privacy` | Returns k-anonymity demographic matrix & consents | None |
| `POST` | `/api/privacy` | Revokes consent or exports user data package | `{ action: 'EXPORT_USER_DATA' }` |

---

## 🗄 Database Schema & Data Model

The schema is defined in [`prisma/schema.prisma`](file:///Users/ayon/Downloads/music/prisma/schema.prisma):

- `User`: Identity with unique `walletAddress`, role (`LISTENER`, `CREATOR`, `ADMIN`), and KYC flag.
- `CreatorProfile`: Stage name, bio, payout wallet, verified status, and total earnings.
- `Track`: Master metadata, lifecycle state (`DRAFT` ➔ `MONETIZED`), IPFS CID, and EIP-712 signature fields.
- `PlaybackSession`: Session token, started/ended timestamps, fraud risk score (0-100), and qualified listening duration.
- `PlaybackEvent`: Granular timeline entries (`START`, `HEARTBEAT`, `SEEK`, `PAUSE`, `STOP`).
- `LedgerAccount`: Chart of accounts with type (`ASSET`, `LIABILITY`, `REVENUE`, `EXPENSE`, `EQUITY`).
- `LedgerEntry`: Double-entry rows storing `amountMinor` (paise), direction (`DEBIT`, `CREDIT`), and idempotency keys.
- `SettlementPeriod`: Numbered periods with total pool minor, committed Merkle root, and Polygon Amoy tx hash.
- `CreatorAllocation`: Creator share with gross royalty, 1% TDS, net claimable paise, and Merkle proof JSON string.
- `ConsentRecord`: User consent with scope, DPDP policy version hash, and revocation status.

---

## 🔧 Troubleshooting & Gotchas

### 1. "Failed to connect to docker API at unix:///Users/ayon/.orbstack/run/docker.sock"
**Cause**: The OrbStack daemon was stopped on your Mac.  
**Resolution**:
```bash
orb start
docker compose up -d
```

### 2. pnpm "Ignored build scripts: @prisma/client, esbuild, prisma"
**Cause**: pnpm v10+ requires build scripts to be explicitly approved.  
**Resolution**: Run `pnpm approve-builds --all` or ensure `onlyBuiltDependencies` is present in `pnpm-workspace.yaml`.

### 3. BigInt JSON Serialization
**Design note**: PostgreSQL `BigInt` (paise) cannot be serialized by standard `JSON.stringify`. Sonder provides a universal helper [`serializeBigInts()`](file:///Users/ayon/Downloads/music/lib/serialize.ts) that recursively maps all `BigInt` values to string format for safe client consumption.

### 4. Database Reset & Reseed
If you want to wipe the database and start fresh with sample data:
```bash
pnpm db:push --force-reset
pnpm db:seed
```

---

## 📜 License & Acknowledgments

Created as a showcase portfolio project illustrating high-stakes fintech and Web3 music engineering.  
Built with Next.js, Prisma, Tailwind CSS, ethers.js, and OrbStack.
