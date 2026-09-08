# Sonder — Technical Architecture Deep-Dive

This document details the architectural principles, mathematical proofs, and compliance models implemented in **Sonder**.

---

## 1. Double-Entry Financial Ledger Design

### The Problem with Single-Balance Ledgers
Conventional web applications often represent user balances as a mutable integer column:
```sql
UPDATE creators SET balance = balance + 500 WHERE id = '...';
```
In high-stakes creator royalty systems, this approach fails:
- It creates no auditable paper trail.
- It makes race conditions and double-spending possible.
- It cannot reconcile external bank escrow deposits with platform liabilities.

### Sonder's Invariant-Enforced Double-Entry Ledger
Sonder enforces a strict accounting equation:
$$\sum \text{Debits} \equiv \sum \text{Credits}$$

Every economic event is an immutable, multi-legged transaction where all entries are expressed in **paise minor units** (1 INR = 100 paise) using signed `BigInt` arithmetic to prevent floating-point rounding errors.

#### Chart of Accounts:
- **1010 Escrow & Cash Vault** (`ASSET`): Holds liquid subscriber subscription fees and cash in escrow.
- **2010 Creator Royalties Payable** (`LIABILITY`): Accrued royalties owed to creators awaiting withdrawal.
- **2020 TDS Withholding Payable** (`LIABILITY`): Statutory 1% tax withheld under Section 194O.
- **3010 Platform Equity Reserve** (`EQUITY`): Platform reserves and retained earnings.
- **4010 Subscriber Royalty Pool Revenue** (`REVENUE`): Monthly listener subscription pool allocated for streaming royalties.
- **5010 Royalty Distribution Expense** (`EXPENSE`): Platform expense incurred for creator streaming distributions.

#### Example: Royalty Allocation with Section 194O TDS
When ₹1,80,000 in royalties are allocated for a period:
- **DEBIT 5010 (Expense)**: ₹1,80,000 (18,000,000 paise)
- **CREDIT 2010 (Creator Royalties Payable Liability)**: ₹1,78,200 (17,820,000 paise)
- **CREDIT 2020 (TDS Withholding Payable Liability)**: ₹1,800 (180,000 paise, 1%)

$$\text{Total Debits} = 18,000,000 = \text{Total Credits} = (17,820,000 + 180,000)$$

If an incoming transaction has even a 1-paisa mismatch, the engine rejects the transaction with an invariant violation exception and halts the database transaction.

---

## 2. Cryptographic Merkle Royalty Settlements

### Why Merkle Trees?
Distributing thousands of creator royalties directly via smart contract storage writes is cost-prohibitive:
- Writing 10,000 creator balances directly on-chain costs thousands of dollars in gas.
- **Merkle Trees** compress the entire period allocation into a single 32-byte cryptographic root hash (`bytes32`).
- The platform commits **only the Merkle root** to the blockchain.
- Any creator can claim their royalties or prove their entitlement by providing an $O(\log N)$ proof path of sibling hashes.

### Deterministic Binary Tree Algorithm
Sonder implements an OpenZeppelin-compatible binary tree:
1. **Leaf Construction**:
   $$\text{Leaf} = \text{keccak256}(\text{abi.encodePacked}(\text{address creator}, \text{uint256 netAmountMinor}, \text{uint256 periodNumber}))$$
2. **Sorted-Pair Node Hashing**:
   To prevent tree order ambiguity, sibling pairs are sorted lexically before hashing:
   $$\text{Parent}(a, b) = \begin{cases} \text{keccak256}(a \mathbin{\Vert} b) & \text{if } a \le b \\ \text{keccak256}(b \mathbin{\Vert} a) & \text{if } a > b \end{cases}$$
3. **Proof Verification**:
   The verifier starts at the leaf and iteratively hashes with sibling nodes along the path. If the resulting root matches the committed on-chain root, inclusion is cryptographically proven:
   ```ts
   let computedHash = leaf;
   for (const proofElement of proof) {
     computedHash = hashPair(computedHash, proofElement);
   }
   return computedHash.toLowerCase() === root.toLowerCase();
   ```

---

## 3. Non-Repudiable EIP-712 Rights Attestation

### The Copyright Problem in Music
Digital platforms frequently face copyright infringement liability because uploads are registered without binding creator warranties.

### The Solution: EIP-712 Structured Signing
Under Section 19 of the Indian Copyright Act 1957, assignments and licenses of copyright must be signed in writing. Sonder translates this into a cryptographically non-repudiable on-chain signature using **EIP-712 Typed Data Signing**:

```ts
const ATTESTATION_TYPES = {
  RightsAttestation: [
    { name: 'creator', type: 'address' },
    { name: 'trackId', type: 'string' },
    { name: 'titleHash', type: 'bytes32' },
    { name: 'audioFingerprint', type: 'string' },
    { name: 'statement', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};
```

When a creator transitions a track to `MONETIZED`:
1. The client presents the typed message to MetaMask or testnet key.
2. The signer computes the ECDSA signature: $(r, s, v)$.
3. The server receives the payload and executes `ethers.verifyTypedData(domain, types, message, signature)` to recover the public key address.
4. If the recovered address matches the registered creator identity, the signature and hash are permanently attached to the track in PostgreSQL.
5. The track state machine advances to `MONETIZED`.

---

## 4. Multi-Signal Stream Fraud & Listening Derivation

### The Threat Model
Malicious actors attempt to artificially inflate qualified stream counts by:
- **Loop farming**: Replaying a 31-second excerpt on continuous repeat.
- **Velocity acceleration**: Triggering fake heartbeats faster than real-world time.
- **Concurrency farming**: Spawning hundreds of simultaneous headless browser sessions.

### Sonder's Multi-Signal Scoring Engine
Playback sessions are evaluated by an automated scoring engine (`0 to 100` penalty points):
1. **Loop Farming Check**: Tracks repeated $\ge 6$ times in an hour without deviation incur $+45$ points.
2. **Concurrency Check**: Single user identity streaming $> 2$ concurrent sessions incurs $+40$ points.
3. **Heartbeat Cadence Drift**: Expected heartbeat interval is 10s. Delivery $< 2\text{s}$ or $> 25\text{s}$ incurs $+30$ points.
4. **Velocity Anomaly Check**: Position jumps without explicit `SEEK` events incur $+35$ points.

### Qualified Listening Derivation
- If $\text{RiskScore} > 50$, the session is immediately marked **`FRAUD_EXCLUDED`**.
- Only non-excluded sessions with $\ge 30$ seconds of continuous playback qualify for royalty pool allocation.

---

## 5. Privacy Vault & k-Anonymity Demographics

### The Regulatory Framework
Under the **Indian Digital Personal Data Protection (DPDP) Act 2023** and **GDPR**, publishing granular audience analytics can allow attackers to re-identify individual listeners via linkage attacks.

### Query-Layer k-Anonymity ($k = 25$)
Sonder enforces a strict $k$-anonymity guarantee at the database query layer:
$$\text{CohortSize}(C) < 25 \implies \text{Suppress}(C)$$

When generating geographical demographic reports:
- Cohorts with $\ge 25$ listeners (e.g. Bengaluru: 840, Mumbai: 620) display aggregated statistics.
- Cohorts with $< 25$ listeners (e.g. Shillong: 19, Goa: 14) are **automatically redacted** to `[SUPPRESSED: < 25 LISTENERS]`.
- User consent records store policy version hashes (`keccak256`) and support statutory one-click revocation.
- Right to Data Portability (DPDP Art 12 / GDPR Art 20) generates an instant, machine-readable JSON bundle.
