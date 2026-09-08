# Security Policy & Cryptographic Architecture

## 🛡️ Security Overview

Sonder is designed with financial-grade security invariants, cryptographic verification, and strict regulatory adherence (Indian Copyright Act §19 and the Digital Personal Data Protection Act 2023).

---

## 🔐 Cryptographic Primitives & Guarantees

### 1. EIP-712 Typed Structured Data Attestations
* **Replay Protection**: Every EIP-712 domain binds strictly to the `chainId` (Polygon Amoy `80002`), contract address, and version string (`"1"`). Signatures cannot be replayed across different chains or dApps.
* **Statutory Compliance**: Attestations encode statutory declarations under Section 19 of the Indian Copyright Act 1957. Signatures are recovered server-side via `ethers.verifyTypedData`.

### 2. Double-Hashed Merkle Leaves
* **Second Preimage Attack Prevention**: Merkle leaf hashes are generated using double-hashing:
  ```solidity
  bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(creator, amount, periodId))));
  ```
  This guarantees that intermediate nodes cannot be spoofed as leaf elements in claim submissions.

### 3. Zero PII On-Chain
* In accordance with India's DPDP Act 2023, **no Personally Identifiable Information (PII) is ever written to the blockchain**.
* The smart contracts store solely 32-byte cryptographic hashes (`merkleRoot`, `ipfsMetadataHash`, `creatorIdHash`) and public Ethereum addresses.

### 4. GAAP Double-Entry Mathematical Invariants
* The internal ledger runs on strict double-entry accounting.
* A transaction is cryptographically rejected if:
  $$\sum \text{Debits} - \sum \text{Credits} \neq 0$$
* All financial amounts are stored in whole integer subunits (paise / wei) to prevent floating-point rounding inaccuracies.

---

## 🔑 Operational Security & Git Hygiene

1. **Environment Variables**:
   * Never commit `.env` or `.env.local` files to git.
   * Verify that `.gitignore` contains `.env`, `broadcast/`, and `cache/`.
2. **Private Key Isolation**:
   * The operator `PRIVATE_KEY` stored in `.env` is solely utilized for automated server-side transactions (submitting Merkle roots).
   * It should hold only minimal testnet POL necessary for gas.
   * User funds and master recordings are controlled solely by creators' own non-custodial wallets (MetaMask / Rabby).

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within Sonder:
1. Please do **NOT** open a public issue on GitHub.
2. Email security findings directly to the maintainers or create a private security advisory.
3. Include detailed steps to reproduce, affected contract/route, and potential impact.
