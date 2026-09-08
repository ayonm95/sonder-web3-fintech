import { ethers } from 'ethers';
import { getLedgerSummary, postDoubleEntryTransaction, calculateSection194OTDS } from '../lib/engines/ledger';
import { buildAllocationMerkleTree, verifyAllocationProof, generateAllocationLeaf } from '../lib/engines/merkle';
import { createAttestationPayload, verifyAttestationSignature } from '../lib/engines/eip712';
import { evaluateSessionFraud, calculateQualifiedListening } from '../lib/engines/fraud';
import { LedgerDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function runTests() {
  console.log('🧪 Starting Sonder Core Engine Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ==========================================
  // 1. DOUBLE-ENTRY LEDGER ENGINE TESTS
  // ==========================================
  console.log('--- 1. Double-Entry Ledger Engine Tests ---');
  
  // Test 1.1: System balance invariant
  const summary = await getLedgerSummary();
  assert(summary.isBalanced, 'Seeded ledger total debits strictly equal total credits');
  assert(
    summary.totalSystemDebits === summary.totalSystemCredits,
    `Ledger debits (${summary.totalSystemDebits}) === credits (${summary.totalSystemCredits})`
  );

  // Test 1.2: Section 194O TDS calculation
  const gross = BigInt(1000000); // ₹10,000 (10,000.00)
  const tdsRes = calculateSection194OTDS(gross);
  assert(tdsRes.tdsAmountMinor === BigInt(10000), 'Section 194O 1% TDS calculated exactly as ₹100.00 (10,000 paise)');
  assert(tdsRes.netAmountMinor === BigInt(990000), 'Net amount calculated exactly as ₹9,900.00 (990,000 paise)');
  assert(tdsRes.grossAmountMinor === tdsRes.tdsAmountMinor + tdsRes.netAmountMinor, 'Gross == TDS + Net');

  // Test 1.3: Unbalanced transaction rejection
  let caughtUnbalancedError = false;
  try {
    await postDoubleEntryTransaction({
      transactionId: 'test_unbalanced_tx',
      idempotencyBaseKey: 'test_unbalanced',
      description: 'Intentional invalid test transaction',
      entries: [
        {
          accountCode: '1010',
          amountMinor: BigInt(5000),
          direction: LedgerDirection.DEBIT,
          description: 'Debit 5000',
          referenceType: 'test',
        },
        {
          accountCode: '4010',
          amountMinor: BigInt(4000), // Differ by 1000!
          direction: LedgerDirection.CREDIT,
          description: 'Credit 4000',
          referenceType: 'test',
        },
      ],
    });
  } catch (err: any) {
    if (err.message.includes('Ledger Invariant Violation')) {
      caughtUnbalancedError = true;
    }
  }
  assert(caughtUnbalancedError, 'Engine strictly blocks unbalanced transactions (debit != credit)');

  // ==========================================
  // 2. CRYPTOGRAPHIC MERKLE SETTLEMENT TESTS
  // ==========================================
  console.log('\n--- 2. Cryptographic Merkle Settlement Tests ---');

  const testAllocations = [
    {
      creatorId: 'c1',
      walletAddress: '0x71c6793f779776d65565b9e048fba96b1a808605',
      netAmountMinor: BigInt(5346000),
      periodNumber: 1,
    },
    {
      creatorId: 'c2',
      walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      netAmountMinor: BigInt(6138000),
      periodNumber: 1,
    },
    {
      creatorId: 'c3',
      walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
      netAmountMinor: BigInt(1534500),
      periodNumber: 1,
    },
    {
      creatorId: 'c4',
      walletAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
      netAmountMinor: BigInt(4801500),
      periodNumber: 1,
    },
  ];

  const tree = buildAllocationMerkleTree(testAllocations);
  assert(typeof tree.root === 'string' && tree.root.startsWith('0x'), 'Merkle tree root generated with valid bytes32 hex');

  // Verify all 4 proofs
  let allProofsValid = true;
  for (const item of tree.itemsWithProofs) {
    const isValid = verifyAllocationProof(item.proof, tree.root, item.leaf);
    if (!isValid) allProofsValid = false;
  }
  assert(allProofsValid, 'All leaf audit proofs verify cryptographically against computed root');

  // Negative test: Corrupted proof or altered amount must fail
  const alteredLeaf = generateAllocationLeaf(
    testAllocations[0].walletAddress,
    testAllocations[0].netAmountMinor + BigInt(100), // Manipulated amount!
    testAllocations[0].periodNumber
  );
  const isManipulatedValid = verifyAllocationProof(
    tree.itemsWithProofs[0].proof,
    tree.root,
    alteredLeaf
  );
  assert(!isManipulatedValid, 'Manipulated royalty amount is rejected by Merkle proof verifier');

  // ==========================================
  // 3. EIP-712 RIGHTS ATTESTATION TESTS
  // ==========================================
  console.log('\n--- 3. EIP-712 Rights Attestation Tests ---');

  const testWallet = ethers.Wallet.createRandom();
  const attestationPayload = createAttestationPayload({
    creatorAddress: testWallet.address,
    trackId: 'track_test_123',
    trackTitle: 'Midnight In Bengaluru',
  });

  const validSig = await testWallet.signTypedData(
    attestationPayload.domain,
    attestationPayload.types,
    attestationPayload.message
  );

  const verifyRes = verifyAttestationSignature({
    message: attestationPayload.message,
    signature: validSig,
    expectedSigner: testWallet.address,
  });

  assert(verifyRes.isValid, 'EIP-712 signature recovered and matches authentic creator address');
  assert(
    verifyRes.recoveredSigner.toLowerCase() === testWallet.address.toLowerCase(),
    'Recovered signer matches test wallet address'
  );

  // Negative test: Signature from different wallet is rejected
  const otherWallet = ethers.Wallet.createRandom();
  const impostorVerify = verifyAttestationSignature({
    message: attestationPayload.message,
    signature: validSig,
    expectedSigner: otherWallet.address,
  });
  assert(!impostorVerify.isValid, 'Impostor signer address is rejected');

  // ==========================================
  // 4. PLAYBACK FRAUD & QUALIFIED LISTENING TESTS
  // ==========================================
  console.log('\n--- 4. Playback Fraud & Qualified Listening Tests ---');

  // Test 4.1: Normal listener session
  const normalEvents = [
    { eventType: 'START' as const, positionSeconds: 0, timestamp: new Date(1000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 10, timestamp: new Date(11000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 20, timestamp: new Date(21000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 30, timestamp: new Date(31000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 40, timestamp: new Date(41000) },
  ];
  const normalFraud = evaluateSessionFraud(normalEvents);
  const normalQualified = calculateQualifiedListening(normalEvents, normalFraud);
  assert(normalFraud.riskScore < 20, `Normal session low risk score (${normalFraud.riskScore}/100)`);
  assert(!normalFraud.isExcluded, 'Normal session NOT marked as fraud excluded');
  assert(normalQualified.isQualified, 'Normal session >= 30s qualifies for royalty distribution');

  // Test 4.2: Bot farm rapid looping session
  const botEvents = [
    { eventType: 'START' as const, positionSeconds: 0, timestamp: new Date(1000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 10, timestamp: new Date(1500) }, // 500ms jump!
    { eventType: 'HEARTBEAT' as const, positionSeconds: 20, timestamp: new Date(2000) },
    { eventType: 'HEARTBEAT' as const, positionSeconds: 30, timestamp: new Date(2500) },
  ];
  const botFraud = evaluateSessionFraud(botEvents, { repeatsCountLastHour: 15 });
  const botQualified = calculateQualifiedListening(botEvents, botFraud);
  assert(botFraud.riskScore > 50, `Bot loop farm flagged with high risk score (${botFraud.riskScore}/100)`);
  assert(botFraud.isExcluded, 'Bot loop farm marked as fraud excluded');
  assert(!botQualified.isQualified, 'Bot loop farm disqualified from royalty pool');

  console.log('\n==========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('==========================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
