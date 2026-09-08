import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import { SettlementStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { periodId } = body;

    if (!periodId) {
      return NextResponse.json({ success: false, error: 'Period ID is required' }, { status: 400 });
    }

    const period = await prisma.settlementPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return NextResponse.json({ success: false, error: 'Period not found' }, { status: 404 });
    }

    if (period.status === SettlementStatus.COMMITTED_ON_CHAIN && period.onChainTxHash) {
      return NextResponse.json({
        success: true,
        message: 'Period is already committed on-chain',
        txHash: period.onChainTxHash,
      });
    }

    const rpcUrl = process.env.AMOY_RPC_URL || process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-amoy.drpc.org';
    const rawPk = (process.env.PRIVATE_KEY || '').trim();
    if (!rawPk) {
      return NextResponse.json({ success: false, error: 'Operator private key not configured' }, { status: 500 });
    }

    const privateKey = rawPk.startsWith('0x') ? rawPk : '0x' + rawPk;
    const network = ethers.Network.from({ name: 'polygon-amoy', chainId: 80002 });
    const provider = new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: network, batchMaxCount: 1 });
    const wallet = new ethers.Wallet(privateKey, provider);

    const contractAddress = process.env.NEXT_PUBLIC_SETTLEMENT_MANAGER_ADDRESS;
    if (!contractAddress) {
      return NextResponse.json({ success: false, error: 'SettlementManager address missing' }, { status: 500 });
    }

    const abi = [
      'function commitPeriodRoot(bytes32 root, uint256 totalPool, bytes32 ipfsHash) external returns (uint256)',
    ];

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(`ipfs://sonder-audit-pack-period-${period.periodNumber}`));

    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 150n) / 100n : ethers.parseUnits('35', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 150n) / 100n : ethers.parseUnits('30', 'gwei');

    const tx = await contract.commitPeriodRoot(
      period.merkleRoot,
      period.totalPoolMinor,
      ipfsHash,
      { maxFeePerGas, maxPriorityFeePerGas }
    );

    await tx.wait(1);

    const updated = await prisma.settlementPeriod.update({
      where: { id: period.id },
      data: {
        onChainTxHash: tx.hash,
        status: SettlementStatus.COMMITTED_ON_CHAIN,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Period #${period.periodNumber} committed to Polygon Amoy`,
      txHash: tx.hash,
      period: updated,
    });
  } catch (error: any) {
    console.error('Failed to commit period on-chain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'On-chain commitment failed' },
      { status: 500 }
    );
  }
}
