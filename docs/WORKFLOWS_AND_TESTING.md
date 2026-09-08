# Sonder — Comprehensive Workflows & Testing Guide

This guide provides end-to-end technical documentation for running, testing, and verifying every subsystem of **Sonder**.

---

## 1. Automated Verification Suite (`pnpm test:engine`)

The fastest way to verify that all mathematical, accounting, and cryptographic invariants hold is via the dedicated engine test suite:

```bash
pnpm test:engine
```

### Test Suite Architecture (`scripts/test-engine.ts`)

| # | Test Area | Test Case | Expected Result |
|---|---|---|---|
| **1.1** | **Ledger Invariant** | Total system debits strictly equal total credits | `summary.isBalanced === true` and `totalDebits === totalCredits` |
| **1.2** | **Section 194O TDS** | 1% statutory TDS calculation on ₹10,000 (1,000,000 paise) | TDS = ₹100.00 (10,000 paise), Net = ₹9,900.00 (990,000 paise), `Gross == TDS + Net` |
| **1.3** | **Unbalanced Postings** | Attempting to post unbalanced entry (Debit 5000 vs Credit 4000) | Rejected immediately with `Ledger Invariant Violation: Total debits != Total credits` |
| **2.1** | **Merkle Tree Root** | Building OpenZeppelin-compatible binary tree | Deterministic `0x` prefixed 32-byte hash root generated |
| **2.2** | **Merkle Proof Path** | Audit proof verification for every creator leaf | `verifyAllocationProof(proof, root, leaf) === true` for all allocations |
| **2.3** | **Tamper Resistance** | Proof verification against manipulated allocation amount | Rejects manipulated leaf (`verifyAllocationProof === false`) |
| **3.1** | **EIP-712 Attestation** | Signature recovery with `ethers.verifyTypedData` | Recovered signer strictly matches creator wallet address |
| **3.2** | **Impostor Signer** | Verifying signature against unauthorized third-party address | Rejects impostor address with verification failure |
| **4.1** | **Human Playback** | Continuous playback with natural 10s heartbeats | Risk score `< 20`, session not excluded, qualified listening granted after 30s |
| **4.2** | **Bot Farm Cluster** | Rapid 500ms heartbeat delivery and 15 continuous loops | Risk score `75/100`, status marked `FRAUD_EXCLUDED`, 0 qualified minutes awarded |

---

## 2. Manual QA & Feature Walkthrough

Start the development server:
```bash
pnpm dev
```
Navigate to `http://localhost:3000` in your web browser.

---

### Scenario A: Audio Streaming & Heartbeat Telemetry
1. Open `http://localhost:3000`.
2. Select any release (e.g. *Monsoon Cybernetics* by *Tarang*).
3. Click the **Play** button.
4. **Observe the Bottom Audio Bar**:
   - Audio begins playback via Web Audio API.
   - Album art, artist name, and title appear on the left.
   - Equalizer bars animate dynamically on the artwork.
5. **Inspect the Heartbeat Telemetry Chip (Bottom Right)**:
   - Green pulsing indicator shows `HB #1 (ses_...)`.
   - Countdown indicates `30s to qualify`.
   - After 30 seconds of continuous playback, the badge turns to **"Qualified Stream"**.
   - Inspect network activity in browser DevTools to see `POST /api/playback-sessions/[token]/heartbeat` every 8 seconds.

---

### Scenario B: Track Ingestion & EIP-712 Rights Attestation
1. Open `http://localhost:3000/studio`.
2. Scroll to **"Ingest New Master Recording"**:
   - Title: `Deccan Drift`
   - Genre: `Indian Electronica`
   - Duration: `210`
   - Click **"Register Master in DRAFT State"**.
3. **Advance the State Machine**:
   - Click **"Upload to Cloud"** ➔ state transitions to `UPLOADED`.
   - Click **"Run HLS Transcode & Fingerprint"** ➔ state transitions to `PROCESSING`.
   - Click **"Submit to Moderation"** ➔ state transitions to `MODERATION_REVIEW`.
   - Click **"Pass Moderation & Publish"** ➔ state transitions to `PUBLISHED`.
4. **Sign Rights Attestation**:
   - On the `PUBLISHED` track, click **"Sign EIP-712 Rights Attestation"**.
   - A modal appears showing the statutory warranty statement under Section 19 of the Indian Copyright Act 1957.
   - Click **"Instant Testnet Key Signer"** (or connect MetaMask).
   - The server verifies the signature, attaches the recovered signer address and hash, and transitions the track to **`MONETIZED`** with confetti!

---

### Scenario C: Double-Entry Financial Invariant & TDS Simulator
1. Open `http://localhost:3000/ledger`.
2. Look at the top invariant badge:
   - `INVARIANT SATISFIED: DEBITS == CREDITS` (Total system debits = Total system credits = ₹4,30,000.00).
3. Review the **Chart of Accounts**:
   - `1010` Escrow Asset: ₹2,50,000.00
   - `2010` Creator Royalties Payable: ₹1,78,200.00
   - `2020` TDS Withholding (Sec 194O): ₹1,800.00
   - `4010` Subscription Revenue: ₹2,50,000.00
   - `5010` Royalty Expense: ₹1,80,000.00
4. **Test the Section 194O Calculator**:
   - Enter `100000` (₹1 Lakh) in the calculator.
   - Observe automatic 1% calculation: ₹1,000 TDS, ₹99,000 net to creator.
5. **Post a Simulated Transaction**:
   - Click **"Subscriber Pool Inflow (+₹1,00,000)"**.
   - Watch the journal table immediately add a new balanced transaction with debit to 1010 and credit to 4010.

---

### Scenario D: Cryptographic Merkle Settlement Explorer
1. Open `http://localhost:3000/settlement`.
2. Review **Period #1**:
   - Total Pool: ₹1,80,000.00
   - Committed Root: `0x211b0bc5a60c11614d3fe347989b1d3a9a9d5f5a56bb40b11317c8c5e88e4637`
3. **Test Proof Verification**:
   - Choose *Tarang* (`0x71C6793f779776d65565B9e048Fba96B1A808605`) in the dropdown.
   - Review the calculated leaf hash and the audit proof path (array of sibling hashes).
   - See the green banner: **"CRYPTOGRAPHICALLY VALID: Proof accurately reconstructs root"**.
4. **Run On-Demand Settlement**:
   - Click **"Trigger Settlement Period Run"**.
   - The platform aggregates all accumulated qualified minutes, computes pro-rata shares, withholds 1% TDS, builds a brand new Merkle tree, and saves the new period.

---

### Scenario E: Anti-Fraud Diagnostics
1. Open `http://localhost:3000/fraud-diagnostics`.
2. Click **"Flagged & Excluded"** tab.
3. Locate session `ses_bot_farm_flagged_loop_cluster_99`:
   - Risk score: **`85/100` (CRITICAL)**.
   - Signals: *Suspicious loop activity (14 consecutive plays) | Unnatural heartbeat delivery intervals*.
   - Status: `FRAUD_EXCLUDED`.
4. Click **"10 Events"** button to open the event audit trace and inspect the millisecond timestamps of the bot delivery.

---

### Scenario F: Fan CRM, k-Anonymity & Privacy Export
1. Open `http://localhost:3000/privacy`.
2. Inspect the **Demographic Audience Cohort Matrix**:
   - High volume cities (*Bengaluru*, *Mumbai*, *Kolkata*) show actual listener counts and average listening minutes.
   - Low volume cities (*Shillong* with 19 listeners, *Goa* with 14 listeners) are **strictly suppressed** with `[SUPPRESSED: < 25]` chips.
3. Scroll to **Immutable DPDP Consent Records**:
   - Click **"Revoke"** on an active consent record to test statutory consent revocation.
4. Click **"Export Personal Data (DPDP Art 12)"**:
   - Downloads a formatted `sonder-dpdp-data-export-[timestamp].json` file with full user profile, playback history, and consent records.

---

## 3. Terminal / Curl API Testing Cheat-Sheet

You can also test all backend APIs directly from your terminal:

### Test Catalog API
```bash
curl -s http://localhost:3000/api/tracks | jq .
```

### Test Double-Entry Ledger API
```bash
curl -s http://localhost:3000/api/ledger | jq .
```

### Simulate a Subscription Batch Deposit
```bash
curl -s -X POST http://localhost:3000/api/ledger \
  -H "Content-Type: application/json" \
  -d '{"action": "SIMULATE_SUBSCRIPTION_INFLOW", "amountInr": "50000"}' | jq .
```

### Simulate Creator Payout with 1% TDS
```bash
curl -s -X POST http://localhost:3000/api/ledger \
  -H "Content-Type: application/json" \
  -d '{"action": "SIMULATE_CREATOR_PAYOUT", "amountInr": "10000"}' | jq .
```

### Test Merkle Settlement Proof API
```bash
curl -s http://localhost:3000/api/settlement/proof/0x71C6793f779776d65565B9e048Fba96B1A808605 | jq .
```

### Test Privacy k-Anonymity API
```bash
curl -s http://localhost:3000/api/privacy | jq .
```

### Start Playback Session via API
```bash
# Get first track ID
TRACK_ID=$(curl -s http://localhost:3000/api/tracks | jq -r '.data[0].id')

# Start session
curl -s -X POST http://localhost:3000/api/playback-sessions \
  -H "Content-Type: application/json" \
  -d "{\"trackId\": \"$TRACK_ID\"}" | jq .
```
