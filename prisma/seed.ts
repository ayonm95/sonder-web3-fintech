import { PrismaClient, Role, TrackState, PlaybackEventType, SessionStatus, SettlementStatus, LedgerDirection, AccountType } from '@prisma/client';
import { CHART_OF_ACCOUNTS, postDoubleEntryTransaction } from '../lib/engines/ledger';
import { buildAllocationMerkleTree } from '../lib/engines/merkle';
import { createAttestationPayload } from '../lib/engines/eip712';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive Sonder platform database seeding...');

  // 1. Clean existing records in reverse topological order
  await prisma.playbackEvent.deleteMany();
  await prisma.playbackSession.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.creatorAllocation.deleteMany();
  await prisma.settlementPeriod.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.track.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned previous database state.');

  // 2. Initialize Chart of Accounts
  for (const acc of CHART_OF_ACCOUNTS) {
    await prisma.ledgerAccount.create({
      data: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
      },
    });
  }
  console.log('🏛️  Chart of Accounts initialized.');

  // 3. Create Users and Creator Profiles
  const artistsData = [
    {
      email: 'tarang@sonder.audio',
      name: 'Tarang Sen',
      stageName: 'Tarang',
      bio: 'Electronic producer blending classical sarod motifs with ambient techno and sub-bass textures.',
      wallet: '0x71C6793f779776d65565B9e048Fba96B1A808605',
      avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    },
    {
      email: 'ananya@sonder.audio',
      name: 'Ananya Roy',
      stageName: 'Ananya',
      bio: 'Kolkata-born singer-songwriter crafting acoustic dream pop drenched in nostalgic tape delay.',
      wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    {
      email: 'kabir@sonder.audio',
      name: 'Kabir Varma',
      stageName: 'KABIR',
      bio: 'Cinematic multi-instrumentalist scoring soaring ambient soundscapes and post-rock crescendos.',
      wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      email: 'meera@sonder.audio',
      name: 'Meera Joshi',
      stageName: 'Meera & The Monsoon',
      bio: 'Neo-soul quartet infusing Hindustani vocal ornamentation with jazz chords and lo-fi groove.',
      wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const createdCreators = [];

  for (const art of artistsData) {
    const user = await prisma.user.create({
      data: {
        email: art.email,
        displayName: art.name,
        role: Role.CREATOR,
        walletAddress: art.wallet,
        isKycVerified: true,
      },
    });

    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        stageName: art.stageName,
        bio: art.bio,
        avatarUrl: art.avatar,
        payoutWallet: art.wallet,
        verifiedOnChain: true,
        onChainTxHash: '0x' + Buffer.from(ethers.randomBytes(32)).toString('hex'),
        totalEarningsMinor: BigInt(4500000), // ₹45,000
      },
    });

    createdCreators.push({ user, creator });
  }

  // Create standard listener user
  const listenerUser = await prisma.user.create({
    data: {
      email: 'listener.arjun@gmail.com',
      displayName: 'Arjun Mehta',
      role: Role.LISTENER,
      walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      isKycVerified: false,
    },
  });

  console.log(`👤 Created ${createdCreators.length} verified creators and 1 listener.`);

  // 4. Create Curated Tracks with Real Audio Streams
  const tracksData = [
    {
      artistIndex: 0,
      title: 'Monsoon Cybernetics',
      genre: 'Indian Electronica',
      durationSeconds: 194,
      audioUrl: '/audio/track-1.wav',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      state: TrackState.MONETIZED,
      totalStreams: 1420,
      qualifiedMinutes: 3840,
    },
    {
      artistIndex: 0,
      title: 'Varanasi Midnight Drone',
      genre: 'Ambient / Drone',
      durationSeconds: 232,
      audioUrl: '/audio/track-2.wav',
      coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      state: TrackState.MONETIZED,
      totalStreams: 980,
      qualifiedMinutes: 2450,
    },
    {
      artistIndex: 1,
      title: 'Letters to Hooghly',
      genre: 'Indie Folk',
      durationSeconds: 215,
      audioUrl: '/audio/track-3.wav',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      state: TrackState.MONETIZED,
      totalStreams: 2840,
      qualifiedMinutes: 7200,
    },
    {
      artistIndex: 2,
      title: 'Northern Ridge Nocturne',
      genre: 'Cinematic Ambient',
      durationSeconds: 260,
      audioUrl: '/audio/track-4.wav',
      coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80',
      state: TrackState.PUBLISHED,
      totalStreams: 640,
      qualifiedMinutes: 1800,
    },
    {
      artistIndex: 3,
      title: 'Saffron Rain (Raag Megh)',
      genre: 'Neo-Soul / Hindustani',
      durationSeconds: 185,
      audioUrl: '/audio/track-5.wav',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      state: TrackState.MONETIZED,
      totalStreams: 3410,
      qualifiedMinutes: 8900,
    },
    {
      artistIndex: 1,
      title: 'Kal Baisakhi Breeze (Acoustic)',
      genre: 'Indie Folk',
      durationSeconds: 178,
      audioUrl: '/audio/track-6.wav',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
      state: TrackState.MODERATION_REVIEW,
      totalStreams: 0,
      qualifiedMinutes: 0,
    },
  ];

  const createdTracks = [];

  for (const t of tracksData) {
    const creator = createdCreators[t.artistIndex].creator;

    // Generate mock EIP-712 attestation hash for monetized tracks
    let attestationSig = null;
    let attestationHash = null;
    let attestationSigner = null;

    if (t.state === TrackState.MONETIZED || t.state === TrackState.PUBLISHED) {
      const mockWallet = ethers.Wallet.createRandom();
      const payload = createAttestationPayload({
        creatorAddress: creator.payoutWallet,
        trackId: 'track_' + Math.random().toString(36).substring(7),
        trackTitle: t.title,
      });
      attestationSig = await mockWallet.signTypedData(payload.domain, payload.types, payload.message);
      attestationHash = ethers.TypedDataEncoder.hash(payload.domain, payload.types, payload.message);
      attestationSigner = creator.payoutWallet;
    }

    const track = await prisma.track.create({
      data: {
        title: t.title,
        genre: t.genre,
        artistId: creator.id,
        durationSeconds: t.durationSeconds,
        audioUrl: t.audioUrl,
        coverUrl: t.coverUrl,
        state: t.state,
        rightsAttestationSignature: attestationSig,
        rightsAttestationHash: attestationHash,
        rightsAttestationSigner: attestationSigner,
        ipfsCid: 'bafybeihdwdcefgh4dqkjv67zbku' + Math.random().toString(36).substring(4),
        audioFingerprint: 'fp_' + ethers.keccak256(ethers.toUtf8Bytes(t.title)).slice(2, 18),
        totalStreams: t.totalStreams,
        qualifiedMinutes: t.qualifiedMinutes,
      },
    });

    createdTracks.push(track);
  }

  console.log(`🎵 Created ${createdTracks.length} tracks across varied lifecycle states.`);

  // 5. Post Initial Double-Entry Ledger Transactions
  console.log('💳 Posting initial double-entry ledger transactions...');

  // Tx 1: Monthly Subscriber Pool Inflow (₹2,50,000 = 25,000,000 paise)
  await postDoubleEntryTransaction({
    transactionId: 'tx_sub_inflow_p1',
    idempotencyBaseKey: 'sub_inflow_batch_p1',
    description: 'Monthly listener subscription pool collection (2,500 active subscribers)',
    entries: [
      {
        accountCode: '1010', // Cash / Escrow Asset
        amountMinor: BigInt(25000000),
        direction: LedgerDirection.DEBIT,
        referenceType: 'subscription_batch',
        referenceId: 'sub_2026_m08',
        description: 'Gross escrow receipt from subscriber UPI recurring mandates',
      },
      {
        accountCode: '4010', // Subscription Revenue
        amountMinor: BigInt(25000000),
        direction: LedgerDirection.CREDIT,
        referenceType: 'subscription_batch',
        referenceId: 'sub_2026_m08',
        description: 'Recognition of monthly subscriber royalty pool',
      },
    ],
  });

  // Tx 2: Royalty Distribution with Section 194O TDS Deduction (₹1,80,000 pool = 18,000,000 paise)
  // Gross: 18,000,000 paise. TDS (1%): 180,000 paise. Net creator liability: 17,820,000 paise.
  await postDoubleEntryTransaction({
    transactionId: 'tx_royalty_alloc_p1',
    idempotencyBaseKey: 'royalty_alloc_p1',
    description: 'Period #1 finalized creator royalty allocation with 1% Sec 194O TDS',
    entries: [
      {
        accountCode: '5010', // Royalty Distribution Expense
        amountMinor: BigInt(18000000),
        direction: LedgerDirection.DEBIT,
        referenceType: 'settlement_period',
        referenceId: 'period_1',
        description: 'Gross royalty distribution expense for Period #1 qualified minutes',
      },
      {
        accountCode: '2010', // Creator Royalties Payable Liability
        amountMinor: BigInt(17820000),
        direction: LedgerDirection.CREDIT,
        referenceType: 'settlement_period',
        referenceId: 'period_1',
        description: 'Net royalties accrued to verified creator escrow balances',
      },
      {
        accountCode: '2020', // TDS Withholding Payable Liability
        amountMinor: BigInt(180000),
        direction: LedgerDirection.CREDIT,
        referenceType: 'settlement_period',
        referenceId: 'period_1',
        description: 'Statutory 1% TDS withheld under Section 194O for government deposit',
      },
    ],
  });

  console.log('✅ Double-entry transactions posted and balanced.');

  // 6. Build Cryptographic Merkle Settlement for Period #1
  console.log('🌳 Building cryptographic Merkle Settlement Period #1...');

  const period1Allocations = [
    {
      creatorId: createdCreators[0].creator.id,
      walletAddress: createdCreators[0].creator.payoutWallet,
      qualifiedMinutes: 6290,
      grossMinor: BigInt(5400000), // ₹54,000
      tdsMinor: BigInt(54000),     // ₹540 (1%)
      netMinor: BigInt(5346000),   // ₹53,460
      periodNumber: 1,
    },
    {
      creatorId: createdCreators[1].creator.id,
      walletAddress: createdCreators[1].creator.payoutWallet,
      qualifiedMinutes: 7200,
      grossMinor: BigInt(6200000), // ₹62,000
      tdsMinor: BigInt(62000),     // ₹620 (1%)
      netMinor: BigInt(6138000),   // ₹61,380
      periodNumber: 1,
    },
    {
      creatorId: createdCreators[2].creator.id,
      walletAddress: createdCreators[2].creator.payoutWallet,
      qualifiedMinutes: 1800,
      grossMinor: BigInt(1550000), // ₹15,500
      tdsMinor: BigInt(15500),     // ₹155 (1%)
      netMinor: BigInt(1534500),   // ₹15,345
      periodNumber: 1,
    },
    {
      creatorId: createdCreators[3].creator.id,
      walletAddress: createdCreators[3].creator.payoutWallet,
      qualifiedMinutes: 8900,
      grossMinor: BigInt(4850000), // ₹48,500
      tdsMinor: BigInt(48500),     // ₹485 (1%)
      netMinor: BigInt(4801500),   // ₹48,015
      periodNumber: 1,
    },
  ];

  const merkleResult = buildAllocationMerkleTree(
    period1Allocations.map((a) => ({
      creatorId: a.creatorId,
      walletAddress: a.walletAddress,
      netAmountMinor: a.netMinor,
      periodNumber: 1,
    }))
  );

  const period1 = await prisma.settlementPeriod.create({
    data: {
      periodNumber: 1,
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
      totalPoolMinor: BigInt(18000000),
      merkleRoot: merkleResult.root,
      ipfsMetadataCid: 'bafybeicg2u4q7xsettlementp1metadatahash',
      onChainTxHash: '0x7e83f9821a8d052b65103c80a71ec26a457492c1015f8e53a209b5523b5d84c1',
      status: SettlementStatus.COMMITTED_ON_CHAIN,
      finalizedAt: new Date('2026-09-01T10:00:00Z'),
    },
  });

  for (const alloc of period1Allocations) {
    const proofItem = merkleResult.itemsWithProofs.find((p) => p.creatorId === alloc.creatorId)!;

    await prisma.creatorAllocation.create({
      data: {
        periodId: period1.id,
        creatorId: alloc.creatorId,
        walletAddress: alloc.walletAddress,
        qualifiedMinutes: alloc.qualifiedMinutes,
        grossAmountMinor: alloc.grossMinor,
        tdsAmountMinor: alloc.tdsMinor,
        netAmountMinor: alloc.netMinor,
        merkleProofJson: JSON.stringify(proofItem.proof),
        isClaimed: false,
      },
    });
  }

  console.log(`🔐 Settlement Period #1 created with Merkle Root: ${merkleResult.root}`);

  // 7. Seed Sample Playback Sessions (Legitimate & Bot Farm Anomaly)
  const legitSession = await prisma.playbackSession.create({
    data: {
      trackId: createdTracks[0].id,
      userId: listenerUser.id,
      sessionToken: 'ses_legit_listener_sample_token_001',
      status: SessionStatus.COMPLETED,
      qualifiedDurationSec: 180,
      fraudRiskScore: 8,
      startedAt: new Date(Date.now() - 3600000),
      endedAt: new Date(Date.now() - 3420000),
    },
  });

  // Events for legit session
  const legitTimestamps = [0, 10, 20, 30, 45, 60, 90, 120, 150, 180];
  for (const sec of legitTimestamps) {
    await prisma.playbackEvent.create({
      data: {
        sessionId: legitSession.id,
        eventType: sec === 0 ? PlaybackEventType.START : PlaybackEventType.HEARTBEAT,
        positionSeconds: sec,
        timestamp: new Date(Date.now() - 3600000 + sec * 1000),
      },
    });
  }

  // Suspicious Bot Farm Playback Session (Flagged & Excluded)
  const botSession = await prisma.playbackSession.create({
    data: {
      trackId: createdTracks[2].id,
      sessionToken: 'ses_bot_farm_flagged_loop_cluster_99',
      status: SessionStatus.FRAUD_EXCLUDED,
      qualifiedDurationSec: 0,
      fraudRiskScore: 85,
      fraudReason: 'Suspicious loop activity: 14 consecutive plays in under 60 minutes | Unnatural heartbeat delivery intervals',
      startedAt: new Date(Date.now() - 1800000),
      endedAt: new Date(Date.now() - 1200000),
    },
  });

  for (let sec = 0; sec <= 40; sec += 5) {
    await prisma.playbackEvent.create({
      data: {
        sessionId: botSession.id,
        eventType: sec === 0 ? PlaybackEventType.START : PlaybackEventType.HEARTBEAT,
        positionSeconds: sec,
        timestamp: new Date(Date.now() - 1800000 + sec * 400), // Unnaturally fast delivery
      },
    });
  }

  console.log('🤖 Seeded playback sessions (1 normal listening stream, 1 flagged bot-farm anomaly).');

  // 8. Seed Privacy Consent Records (DPDP / GDPR)
  await prisma.consentRecord.create({
    data: {
      userId: listenerUser.id,
      creatorId: createdCreators[0].creator.id,
      scope: 'crm.vinyl_and_merch_drops',
      policyVersionHash: ethers.keccak256(ethers.toUtf8Bytes('DPDP-2023-CONSENT-POLICY-V1.2')),
      isRevoked: false,
    },
  });

  await prisma.consentRecord.create({
    data: {
      userId: listenerUser.id,
      creatorId: createdCreators[1].creator.id,
      scope: 'crm.tour_announcements',
      policyVersionHash: ethers.keccak256(ethers.toUtf8Bytes('DPDP-2023-CONSENT-POLICY-V1.2')),
      isRevoked: false,
    },
  });

  console.log('🛡️  Seeded privacy consent records under DPDP Act framework.');
  console.log('✨ All Sonder platform database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
