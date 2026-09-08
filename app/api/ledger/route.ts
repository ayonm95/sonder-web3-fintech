import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getLedgerSummary,
  postDoubleEntryTransaction,
  calculateSection194OTDS,
} from '@/lib/engines/ledger';
import { LedgerDirection } from '@prisma/client';

export async function GET() {
  try {
    const summary = await getLedgerSummary();

    const recentEntries = await prisma.ledgerEntry.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
      },
    });

    // Helper to serialize BigInt
    const serializedSummary = {
      isBalanced: summary.isBalanced,
      totalSystemDebitsMinor: summary.totalSystemDebits.toString(),
      totalSystemCreditsMinor: summary.totalSystemCredits.toString(),
      accounts: summary.accounts.map((acc) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
        entryCount: acc.entryCount,
        debitSumMinor: acc.debitSum.toString(),
        creditSumMinor: acc.creditSum.toString(),
        netBalanceMinor: acc.netBalance.toString(),
      })),
      recentEntries: recentEntries.map((e) => ({
        id: e.id,
        transactionId: e.transactionId,
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        amountMinor: e.amountMinor.toString(),
        direction: e.direction,
        referenceType: e.referenceType,
        referenceId: e.referenceId,
        description: e.description,
        createdAt: e.createdAt,
      })),
    };

    return NextResponse.json({ success: true, data: serializedSummary });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ledger' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, amountInr } = body;

    const amountMinor = BigInt(Math.floor(parseFloat(amountInr || '1000') * 100));
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (action === 'SIMULATE_SUBSCRIPTION_INFLOW') {
      // Debit Cash 1010, Credit Revenue 4010
      await postDoubleEntryTransaction({
        transactionId: txId,
        idempotencyBaseKey: `sub_${txId}`,
        description: `Simulated listener subscription batch deposit of ₹${(Number(amountMinor) / 100).toFixed(2)}`,
        entries: [
          {
            accountCode: '1010',
            amountMinor,
            direction: LedgerDirection.DEBIT,
            referenceType: 'subscription_inflow',
            description: 'Escrow intake from subscriber UPI recurring charge',
          },
          {
            accountCode: '4010',
            amountMinor,
            direction: LedgerDirection.CREDIT,
            referenceType: 'subscription_inflow',
            description: 'Platform streaming subscription revenue recognition',
          },
        ],
      });
    } else if (action === 'SIMULATE_CREATOR_PAYOUT') {
      // Payout with TDS:
      // Debit Royalties Payable 2010 (gross)
      // Credit Cash 1010 (net)
      // Credit TDS Payable 2020 (1% TDS)
      const tds = calculateSection194OTDS(amountMinor);

      await postDoubleEntryTransaction({
        transactionId: txId,
        idempotencyBaseKey: `payout_${txId}`,
        description: `Simulated creator payout of ₹${(Number(amountMinor) / 100).toFixed(2)} with Section 194O TDS`,
        entries: [
          {
            accountCode: '2010',
            amountMinor: tds.grossAmountMinor,
            direction: LedgerDirection.DEBIT,
            referenceType: 'creator_payout',
            description: 'Settlement of accrued creator royalties payable liability',
          },
          {
            accountCode: '1010',
            amountMinor: tds.netAmountMinor,
            direction: LedgerDirection.CREDIT,
            referenceType: 'creator_payout',
            description: 'Net escrow bank transfer via IMPS/UPI Penny Drop',
          },
          {
            accountCode: '2020',
            amountMinor: tds.tdsAmountMinor,
            direction: LedgerDirection.CREDIT,
            referenceType: 'creator_payout',
            description: 'Statutory 1% TDS withheld under Section 194O',
          },
        ],
      });
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction successfully committed to double-entry ledger',
      transactionId: txId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Transaction rejected' },
      { status: 500 }
    );
  }
}
