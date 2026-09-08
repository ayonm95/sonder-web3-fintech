import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startPlaybackSession } from '@/lib/engines/playback';

import { serializeBigInts } from '@/lib/serialize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const sessions = await prisma.playbackSession.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        track: {
          include: {
            artist: true,
          },
        },
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: serializeBigInts(sessions) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch playback sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackId, userId } = body;

    if (!trackId) {
      return NextResponse.json(
        { success: false, error: 'trackId is required' },
        { status: 400 }
      );
    }

    const session = await startPlaybackSession({
      trackId,
      userId,
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start playback session' },
      { status: 500 }
    );
  }
}
