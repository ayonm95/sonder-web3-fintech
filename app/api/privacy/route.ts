import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const consents = await prisma.consentRecord.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Demonstrate k-anonymity demographic reporting
    // Buckets with fewer than 25 listeners are strictly suppressed
    const rawListenerCohorts = [
      { city: 'Bengaluru', listenersCount: 840, avgStreamMin: 42.5 },
      { city: 'Mumbai', listenersCount: 620, avgStreamMin: 38.1 },
      { city: 'Kolkata', listenersCount: 310, avgStreamMin: 49.0 },
      { city: 'Shillong', listenersCount: 19, avgStreamMin: 65.4 }, // < 25 -> SUPPRESSED!
      { city: 'Goa', listenersCount: 14, avgStreamMin: 52.8 },      // < 25 -> SUPPRESSED!
      { city: 'Pune', listenersCount: 195, avgStreamMin: 31.2 },
    ];

    const K_THRESHOLD = 25;

    const kAnonymityProtectedCohorts = rawListenerCohorts.map((cohort) => {
      const isSuppressed = cohort.listenersCount < K_THRESHOLD;
      return {
        city: cohort.city,
        listenersCount: isSuppressed ? `[SUPPRESSED: < ${K_THRESHOLD}]` : cohort.listenersCount,
        avgStreamMin: isSuppressed ? '[SUPPRESSED]' : cohort.avgStreamMin,
        isSuppressed,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        kThreshold: K_THRESHOLD,
        cohorts: kAnonymityProtectedCohorts,
        consents: consents.map((c) => ({
          id: c.id,
          userEmail: c.user.email,
          scope: c.scope,
          policyVersionHash: c.policyVersionHash,
          isRevoked: c.isRevoked,
          createdAt: c.createdAt,
          revokedAt: c.revokedAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Privacy report failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, consentId, userId } = body;

    if (action === 'REVOKE_CONSENT') {
      const updated = await prisma.consentRecord.update({
        where: { id: consentId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Consent revoked under DPDP Act provisions',
        data: updated,
      });
    }

    if (action === 'EXPORT_USER_DATA') {
      // Full GDPR / DPDP Art 12 data export
      const targetUser = await prisma.user.findFirst({
        where: userId ? { id: userId } : undefined,
        include: {
          playbackSessions: {
            include: {
              events: true,
              track: true,
            },
          },
          consents: true,
          creatorProfile: {
            include: {
              tracks: true,
              allocations: true,
            },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        exportTimestamp: new Date().toISOString(),
        dpdpComplianceStatus: 'ARTICLE_12_SUBJECT_ACCESS_REQUEST_FULFILLED',
        userData: targetUser,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
