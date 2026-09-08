import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAllocationMerkleTree } from '@/lib/engines/merkle';
import { calculateSection194OTDS } from '@/lib/engines/ledger';
import { SettlementStatus } from '@prisma/client';

export async function GET() {
  try {
    const periods = await prisma.settlementPeriod.findMany({
      orderBy: { periodNumber: 'desc' },
      include: {
        allocations: {
          include: {
            creator: true,
          },
        },
      },
    });

    const serializedPeriods = periods.map((p) => ({
      id: p.id,
      periodNumber: p.periodNumber,
      startDate: p.startDate,
      endDate: p.endDate,
      totalPoolMinor: p.totalPoolMinor.toString(),
      merkleRoot: p.merkleRoot,
      onChainTxHash: p.onChainTxHash,
      status: p.status,
      finalizedAt: p.finalizedAt,
      allocations: p.allocations.map((a) => ({
        id: a.id,
        creatorId: a.creatorId,
        stageName: a.creator.stageName,
        walletAddress: a.walletAddress,
        qualifiedMinutes: a.qualifiedMinutes,
        grossAmountMinor: a.grossAmountMinor.toString(),
        tdsAmountMinor: a.tdsAmountMinor.toString(),
        netAmountMinor: a.netAmountMinor.toString(),
        merkleProof: JSON.parse(a.merkleProofJson),
        isClaimed: a.isClaimed,
      })),
    }));

    return NextResponse.json({ success: true, data: serializedPeriods });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const totalPoolInr = parseFloat(body.totalPoolInr || '200000');
    const totalPoolMinor = BigInt(Math.floor(totalPoolInr * 100));

    // Fetch all creators and their current qualified minutes across tracks
    const creators = await prisma.creatorProfile.findMany({
      include: {
        tracks: true,
      },
    });

    if (creators.length === 0) {
      return NextResponse.json({ success: false, error: 'No creators found' }, { status: 400 });
    }

    // Determine total qualified minutes
    let totalQualifiedMinutes = 0;
    const creatorMinutes = creators.map((c) => {
      const minutes = c.tracks.reduce((sum, t) => sum + t.qualifiedMinutes, 0) || 100; // minimum baseline
      totalQualifiedMinutes += minutes;
      return { creator: c, minutes };
    });

    const lastPeriod = await prisma.settlementPeriod.findFirst({
      orderBy: { periodNumber: 'desc' },
    });
    const nextPeriodNumber = (lastPeriod?.periodNumber || 0) + 1;

    // Calculate pro-rata gross, 1% TDS, and net minor for each creator
    const allocationItems = creatorMinutes.map(({ creator, minutes }) => {
      const share = BigInt(minutes) * totalPoolMinor;
      const grossMinor = share / BigInt(totalQualifiedMinutes);
      const { tdsAmountMinor, netAmountMinor } = calculateSection194OTDS(grossMinor);

      return {
        creatorId: creator.id,
        walletAddress: creator.payoutWallet,
        minutes,
        grossMinor,
        tdsMinor: tdsAmountMinor,
        netMinor: netAmountMinor,
        periodNumber: nextPeriodNumber,
      };
    });

    // Generate cryptographic Merkle Tree
    const merkleResult = buildAllocationMerkleTree(
      allocationItems.map((a) => ({
        creatorId: a.creatorId,
        walletAddress: a.walletAddress,
        netAmountMinor: a.netMinor,
        periodNumber: nextPeriodNumber,
      }))
    );

    // Save period to database
    const newPeriod = await prisma.settlementPeriod.create({
      data: {
        periodNumber: nextPeriodNumber,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        totalPoolMinor,
        merkleRoot: merkleResult.root,
        status: SettlementStatus.CALCULATED,
        finalizedAt: new Date(),
      },
    });

    // Save individual creator allocations with proofs
    for (const alloc of allocationItems) {
      const proofItem = merkleResult.itemsWithProofs.find((p) => p.creatorId === alloc.creatorId)!;

      await prisma.creatorAllocation.create({
        data: {
          periodId: newPeriod.id,
          creatorId: alloc.creatorId,
          walletAddress: alloc.walletAddress,
          qualifiedMinutes: alloc.minutes,
          grossAmountMinor: alloc.grossMinor,
          tdsAmountMinor: alloc.tdsMinor,
          netAmountMinor: alloc.netMinor,
          merkleProofJson: JSON.stringify(proofItem.proof),
          isClaimed: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Settlement Period #${nextPeriodNumber} successfully computed`,
      merkleRoot: merkleResult.root,
      periodNumber: nextPeriodNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Settlement build failed' },
      { status: 500 }
    );
  }
}
