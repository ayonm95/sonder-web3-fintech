import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAllocationLeaf, verifyAllocationProof } from '@/lib/engines/merkle';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    const allocation = await prisma.creatorAllocation.findFirst({
      where: {
        walletAddress: {
          equals: wallet,
          mode: 'insensitive',
        },
      },
      include: {
        period: true,
        creator: true,
      },
      orderBy: {
        period: {
          periodNumber: 'desc',
        },
      },
    });

    if (!allocation) {
      return NextResponse.json(
        { success: false, error: 'No allocation found for this wallet address' },
        { status: 404 }
      );
    }

    const proof: string[] = JSON.parse(allocation.merkleProofJson);
    const leaf = generateAllocationLeaf(
      allocation.walletAddress,
      allocation.netAmountMinor,
      allocation.period.periodNumber
    );

    const isProofValid = allocation.period.merkleRoot
      ? verifyAllocationProof(proof, allocation.period.merkleRoot, leaf)
      : false;

    return NextResponse.json({
      success: true,
      data: {
        creatorStageName: allocation.creator.stageName,
        walletAddress: allocation.walletAddress,
        periodNumber: allocation.period.periodNumber,
        grossAmountMinor: allocation.grossAmountMinor.toString(),
        tdsAmountMinor: allocation.tdsAmountMinor.toString(),
        netAmountMinor: allocation.netAmountMinor.toString(),
        merkleRoot: allocation.period.merkleRoot,
        leaf,
        proof,
        isProofValid,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Proof lookup failed' },
      { status: 500 }
    );
  }
}
