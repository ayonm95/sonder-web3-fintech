import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TrackState } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<TrackState, TrackState[]> = {
  [TrackState.DRAFT]: [TrackState.UPLOADED],
  [TrackState.UPLOADED]: [TrackState.PROCESSING],
  [TrackState.PROCESSING]: [TrackState.MODERATION_REVIEW],
  [TrackState.MODERATION_REVIEW]: [TrackState.PUBLISHED, TrackState.SUSPENDED],
  [TrackState.PUBLISHED]: [TrackState.MONETIZED, TrackState.SUSPENDED],
  [TrackState.MONETIZED]: [TrackState.SUSPENDED],
  [TrackState.SUSPENDED]: [TrackState.DRAFT, TrackState.MODERATION_REVIEW],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetState } = body;

    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ success: false, error: 'Track not found' }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[track.state] || [];
    if (!allowed.includes(targetState)) {
      return NextResponse.json(
        {
          success: false,
          error: `Illegal state transition from ${track.state} to ${targetState}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        },
        { status: 400 }
      );
    }

    // Gating for MONETIZED: must have cryptographic EIP-712 rights attestation
    if (targetState === TrackState.MONETIZED && !track.rightsAttestationSignature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot transition to MONETIZED: EIP-712 Rights Attestation signature required.',
        },
        { status: 422 }
      );
    }

    const updated = await prisma.track.update({
      where: { id },
      data: { state: targetState },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'State transition failed' },
      { status: 500 }
    );
  }
}
