import { TrackState } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInts } from '@/lib/serialize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') as TrackState | null;

    const tracks = await prisma.track.findMany({
      where: state ? { state } : undefined,
      include: {
        artist: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: serializeBigInts(tracks) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, genre, audioUrl, coverUrl, durationSeconds, artistId } = body;

    if (!title || !audioUrl) {
      return NextResponse.json(
        { success: false, error: 'Title and audio URL are required' },
        { status: 400 }
      );
    }

    // Default to the first creator profile if not specified
    let targetArtistId = artistId;
    if (!targetArtistId) {
      const firstCreator = await prisma.creatorProfile.findFirst();
      if (!firstCreator) {
        return NextResponse.json(
          { success: false, error: 'No creator profile found to assign track' },
          { status: 400 }
        );
      }
      targetArtistId = firstCreator.id;
    }

    const track = await prisma.track.create({
      data: {
        title,
        genre: genre || 'Indie / Electronic',
        audioUrl,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        durationSeconds: durationSeconds || 180,
        artistId: targetArtistId,
        state: TrackState.DRAFT,
      },
      include: {
        artist: true,
      },
    });

    return NextResponse.json({ success: true, data: serializeBigInts(track) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create track' },
      { status: 500 }
    );
  }
}
