export interface SessionEvent {
  eventType: 'START' | 'HEARTBEAT' | 'SEEK' | 'PAUSE' | 'RESUME' | 'STOP' | 'COMPLETE';
  positionSeconds: number;
  timestamp: Date;
}

export interface FraudAnalysisResult {
  riskScore: number; // 0 to 100
  isExcluded: boolean; // True if riskScore > 50
  signals: {
    loopFarming: boolean;
    velocityAnomaly: boolean;
    heartbeatDrift: boolean;
    concurrencyAnomaly: boolean;
  };
  reasons: string[];
}

/**
 * Analyzes a playback session's event history to detect streaming fraud
 */
export function evaluateSessionFraud(events: SessionEvent[], context?: {
  concurrentSessionsCount?: number;
  repeatsCountLastHour?: number;
  trackDurationSeconds?: number;
}): FraudAnalysisResult {
  const reasons: string[] = [];
  let score = 0;

  const signals = {
    loopFarming: false,
    velocityAnomaly: false,
    heartbeatDrift: false,
    concurrencyAnomaly: false,
  };

  if (events.length === 0) {
    return { riskScore: 0, isExcluded: false, signals, reasons: ['No events recorded'] };
  }

  // 1. Loop farming check
  if (context?.repeatsCountLastHour && context.repeatsCountLastHour >= 6) {
    signals.loopFarming = true;
    score += 45;
    reasons.push(`Suspicious loop activity: ${context.repeatsCountLastHour} consecutive plays in under 60 minutes`);
  }

  // 2. Concurrency anomaly
  if (context?.concurrentSessionsCount && context.concurrentSessionsCount > 2) {
    signals.concurrencyAnomaly = true;
    score += 40;
    reasons.push(`High concurrency: ${context.concurrentSessionsCount} concurrent streams from single listener identity`);
  }

  // 3. Heartbeat cadence & velocity check
  const heartbeats = events.filter((e) => e.eventType === 'HEARTBEAT');
  if (heartbeats.length >= 3) {
    let driftCount = 0;
    for (let i = 1; i < heartbeats.length; i++) {
      const timeDeltaMs = heartbeats[i].timestamp.getTime() - heartbeats[i - 1].timestamp.getTime();
      const posDeltaSec = heartbeats[i].positionSeconds - heartbeats[i - 1].positionSeconds;

      // Heartbeats should arrive approximately every 10 seconds (5s - 20s window)
      if (timeDeltaMs < 2000 || timeDeltaMs > 25000) {
        driftCount++;
      }

      // Position shouldn't jump drastically without SEEK event
      if (posDeltaSec > 25 || posDeltaSec < 0) {
        signals.velocityAnomaly = true;
      }
    }

    if (driftCount >= 2) {
      signals.heartbeatDrift = true;
      score += 30;
      reasons.push('Unnatural heartbeat delivery intervals (bot playback cadence)');
    }

    if (signals.velocityAnomaly) {
      score += 35;
      reasons.push('Audio position velocity anomaly detected');
    }
  }

  const finalScore = Math.min(100, score);
  const isExcluded = finalScore > 50;

  return {
    riskScore: finalScore,
    isExcluded,
    signals,
    reasons,
  };
}

/**
 * Derives server-authoritative qualified listening duration (seconds)
 * Standard rule: >= 30 continuous seconds of non-fraudulent playback constitutes qualified stream
 */
export function calculateQualifiedListening(
  events: SessionEvent[],
  fraudResult: FraudAnalysisResult
): { isQualified: boolean; qualifiedSeconds: number } {
  if (fraudResult.isExcluded) {
    return { isQualified: false, qualifiedSeconds: 0 };
  }

  if (events.length === 0) {
    return { isQualified: false, qualifiedSeconds: 0 };
  }

  // Find max position reached smoothly
  const maxPosition = Math.max(...events.map((e) => e.positionSeconds), 0);

  const isQualified = maxPosition >= 30;
  return {
    isQualified,
    qualifiedSeconds: maxPosition,
  };
}
