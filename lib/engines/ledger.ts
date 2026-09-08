import { prisma } from '../prisma';
import { AccountType, LedgerDirection } from '@prisma/client';

export interface LedgerEntryInput {
  accountCode: string;
  amountMinor: bigint;
  direction: LedgerDirection;
  description: string;
  referenceType: string;
  referenceId?: string;
}

export interface TransactionInput {
  transactionId: string;
  idempotencyBaseKey: string;
  description: string;
  entries: LedgerEntryInput[];
}

export const CHART_OF_ACCOUNTS = [
  {
    code: '1010',
    name: 'Escrow & Cash Vault',
    type: AccountType.ASSET,
    description: 'Liquid subscriber funds and platform cash reserves held in escrow',
  },
  {
    code: '2010',
    name: 'Creator Royalties Payable',
    type: AccountType.LIABILITY,
    description: 'Accrued royalties owed to creators awaiting withdrawal',
  },
  {
    code: '2020',
    name: 'TDS Withholding Payable (Section 194O)',
    type: AccountType.LIABILITY,
    description: '1% statutory tax deducted at source to be remitted to government',
  },
  {
    code: '3010',
    name: 'Platform Equity Reserve',
    type: AccountType.EQUITY,
    description: 'Retained earnings and platform reserve equity',
  },
  {
    code: '4010',
    name: 'Subscriber Royalty Pool Revenue',
    type: AccountType.REVENUE,
    description: 'Monthly listener subscription pool allocated for streaming royalties',
  },
  {
    code: '5010',
    name: 'Royalty Distribution Expense',
    type: AccountType.EXPENSE,
    description: 'Platform expense incurred for creator streaming distributions',
  },
];

/**
 * Initializes standard chart of accounts if not present
 */
export async function ensureChartOfAccounts(): Promise<void> {
  for (const account of CHART_OF_ACCOUNTS) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type, description: account.description },
      create: {
        code: account.code,
        name: account.name,
        type: account.type,
        description: account.description,
      },
    });
  }
}

/**
 * Core Double-Entry Transaction Poster
 * Invariant: Sum of DEBITS must strictly equal Sum of CREDITS.
 * All amounts are in Minor Units (Paise: 1 INR = 100 Paise).
 */
export async function postDoubleEntryTransaction(input: TransactionInput) {
  if (input.entries.length < 2) {
    throw new Error('A double-entry transaction must contain at least two entries.');
  }

  let totalDebits = BigInt(0);
  let totalCredits = BigInt(0);

  for (const entry of input.entries) {
    if (entry.amountMinor <= BigInt(0)) {
      throw new Error(`Invalid entry amount ${entry.amountMinor}: amounts must be positive integers.`);
    }

    if (entry.direction === LedgerDirection.DEBIT) {
      totalDebits += entry.amountMinor;
    } else if (entry.direction === LedgerDirection.CREDIT) {
      totalCredits += entry.amountMinor;
    } else {
      throw new Error(`Invalid direction: ${entry.direction}`);
    }
  }

  // Strict double-entry invariant assertion
  if (totalDebits !== totalCredits) {
    throw new Error(
      `Ledger Invariant Violation: Total debits (${totalDebits.toString()} paise) != Total credits (${totalCredits.toString()} paise). Difference: ${(totalDebits - totalCredits).toString()} paise.`
    );
  }

  // Execute atomic batch
  return await prisma.$transaction(async (tx) => {
    const createdEntries = [];

    for (let i = 0; i < input.entries.length; i++) {
      const entry = input.entries[i];
      const account = await tx.ledgerAccount.findUnique({
        where: { code: entry.accountCode },
      });

      if (!account) {
        throw new Error(`Ledger account code ${entry.accountCode} not found in chart of accounts.`);
      }

      const idempotencyKey = `${input.idempotencyBaseKey}_idx_${i}`;

      const created = await tx.ledgerEntry.create({
        data: {
          transactionId: input.transactionId,
          accountId: account.id,
          amountMinor: entry.amountMinor,
          direction: entry.direction,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          idempotencyKey,
          description: entry.description,
        },
      });

      createdEntries.push(created);
    }

    return createdEntries;
  });
}

/**
 * Calculates Section 194O TDS (1% deduction on marketplace e-commerce royalty payments)
 * Under Indian Income Tax Act Sec 194O, 1% TDS applies to gross amounts paid/credited to creators.
 */
export function calculateSection194OTDS(grossAmountMinor: bigint): {
  grossAmountMinor: bigint;
  tdsAmountMinor: bigint;
  netAmountMinor: bigint;
} {
  // 1% of gross (paise) rounded mathematically
  const tdsAmountMinor = (grossAmountMinor * BigInt(1)) / BigInt(100);
  const netAmountMinor = grossAmountMinor - tdsAmountMinor;

  return {
    grossAmountMinor,
    tdsAmountMinor,
    netAmountMinor,
  };
}

/**
 * Summarizes balance sheet and verifies system-wide debit/credit balance
 */
export async function getLedgerSummary() {
  const accounts = await prisma.ledgerAccount.findMany({
    include: {
      entries: true,
    },
    orderBy: { code: 'asc' },
  });

  let totalSystemDebits = BigInt(0);
  let totalSystemCredits = BigInt(0);

  const accountSummaries = accounts.map((acc) => {
    let debitSum = BigInt(0);
    let creditSum = BigInt(0);

    for (const entry of acc.entries) {
      if (entry.direction === LedgerDirection.DEBIT) {
        debitSum += entry.amountMinor;
        totalSystemDebits += entry.amountMinor;
      } else {
        creditSum += entry.amountMinor;
        totalSystemCredits += entry.amountMinor;
      }
    }

    // Normal balance convention:
    // Assets & Expenses: Net = Debit - Credit
    // Liabilities, Equity, Revenue: Net = Credit - Debit
    const isDebitNormal = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
    const netBalance = isDebitNormal ? debitSum - creditSum : creditSum - debitSum;

    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      description: acc.description,
      debitSum,
      creditSum,
      netBalance,
      entryCount: acc.entries.length,
    };
  });

  const isBalanced = totalSystemDebits === totalSystemCredits;

  return {
    isBalanced,
    totalSystemDebits,
    totalSystemCredits,
    accounts: accountSummaries,
  };
}
