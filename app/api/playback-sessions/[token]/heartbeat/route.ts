import { NextResponse } from 'next/server';
import { recordPlaybackHeartbeat } from '@/lib/engines/playback';
import { PlaybackEventType } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { positionSeconds, eventType } = body;

    if (positionSeconds === undefined || positionSeconds === null) {
      return NextResponse.json(
        { success: false, error: 'positionSeconds is required' },
        { status: 400 }
      );
    }

    const result = await recordPlaybackHeartbeat({
      sessionToken: token,
      positionSeconds: Math.floor(positionSeconds),
      eventType: (eventType as PlaybackEventType) || PlaybackEventType.HEARTBEAT,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionToken: result.session.sessionToken,
        status: result.session.status,
        qualifiedDurationSec: result.session.qualifiedDurationSec,
        fraudRiskScore: result.session.fraudRiskScore,
        fraudReason: result.session.fraudReason,
        isQualified: result.qualifiedResult.isQualified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record playback heartbeat' },
      { status: 500 }
    );
  }
}
