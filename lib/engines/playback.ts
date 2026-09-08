import { prisma } from '../prisma';
import { PlaybackEventType, SessionStatus } from '@prisma/client';
import { evaluateSessionFraud, calculateQualifiedListening } from './fraud';
import crypto from 'crypto';

/**
 * Creates a new server-managed playback session
 */
export async function startPlaybackSession(params: {
  trackId: string;
  userId?: string;
}) {
  const sessionToken = `ses_${crypto.randomBytes(24).toString('hex')}`;

  const session = await prisma.playbackSession.create({
    data: {
      trackId: params.trackId,
      userId: params.userId,
      sessionToken,
      status: SessionStatus.ACTIVE,
      startedAt: new Date(),
      fraudRiskScore: 0,
    },
    include: {
      track: {
        include: {
          artist: true,
        },
      },
    },
  });

  // Record initial START event
  await prisma.playbackEvent.create({
    data: {
      sessionId: session.id,
      eventType: PlaybackEventType.START,
      positionSeconds: 0,
      timestamp: new Date(),
    },
  });

  return session;
}

/**
 * Records a client heartbeat event and recalculates fraud risk and qualified listening
 */
export async function recordPlaybackHeartbeat(params: {
  sessionToken: string;
  positionSeconds: number;
  eventType?: PlaybackEventType;
}) {
  const session = await prisma.playbackSession.findUnique({
    where: { sessionToken: params.sessionToken },
    include: {
      events: {
        orderBy: { timestamp: 'asc' },
      },
      track: true,
    },
  });

  if (!session) {
    throw new Error('Playback session not found');
  }

  const eventType = params.eventType || PlaybackEventType.HEARTBEAT;

  // Insert event
  const newEvent = await prisma.playbackEvent.create({
    data: {
      sessionId: session.id,
      eventType,
      positionSeconds: params.positionSeconds,
      timestamp: new Date(),
    },
  });

  const allEvents = [...session.events, newEvent];

  // Evaluate fraud signals
  const fraudResult = evaluateSessionFraud(
    allEvents.map((e) => ({
      eventType: e.eventType,
      positionSeconds: e.positionSeconds,
      timestamp: e.timestamp,
    })),
    {
      trackDurationSeconds: session.track.durationSeconds,
    }
  );

  // Compute qualified listening
  const qualifiedResult = calculateQualifiedListening(
    allEvents.map((e) => ({
      eventType: e.eventType,
      positionSeconds: e.positionSeconds,
      timestamp: e.timestamp,
    })),
    fraudResult
  );

  const updatedStatus = fraudResult.isExcluded
    ? SessionStatus.FRAUD_EXCLUDED
    : session.status;

  const updatedSession = await prisma.playbackSession.update({
    where: { id: session.id },
    data: {
      fraudRiskScore: fraudResult.riskScore,
      fraudReason: fraudResult.reasons.join(' | ') || null,
      qualifiedDurationSec: qualifiedResult.qualifiedSeconds,
      status: updatedStatus,
    },
  });

  // If newly reached qualified threshold, increment track stats
  if (
    qualifiedResult.isQualified &&
    session.qualifiedDurationSec < 30 &&
    !fraudResult.isExcluded
  ) {
    await prisma.track.update({
      where: { id: session.trackId },
      data: {
        totalStreams: { increment: 1 },
        qualifiedMinutes: {
          increment: Math.max(1, Math.floor(qualifiedResult.qualifiedSeconds / 60)),
        },
      },
    });
  }

  return {
    session: updatedSession,
    fraudResult,
    qualifiedResult,
  };
}
