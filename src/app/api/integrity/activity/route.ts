import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IntegrityLog from '@/models/IntegrityLog';
import ParticipantIntegrity from '@/models/ParticipantIntegrity';
import { requireAuthentication } from '@/app/api/_lib/authorization';

function calculateSeverity(durationMs: number): string {
  const seconds = durationMs / 1000;
  if (seconds <= 3) return 'NORMAL';
  if (seconds <= 10) return 'MINOR';
  if (seconds <= 30) return 'SUSPICIOUS';
  if (seconds <= 60) return 'HIGH';
  return 'CRITICAL';
}

function calculateScorePenalty(durationMs: number, reasons: string[]): number {
  let penalty = 1; // Base penalty for an away session
  const seconds = durationMs / 1000;
  
  if (seconds > 60) penalty += 10;
  else if (seconds > 30) penalty += 5;
  else if (seconds > 10) penalty += 2;
  
  if (reasons.includes('FULLSCREEN_EXIT')) penalty += 3;
  
  return penalty;
}

function determineStatus(score: number): string {
  if (score < 5) return 'NORMAL';
  if (score < 10) return 'REVIEW';
  if (score < 20) return 'SUSPICIOUS';
  return 'HIGH_ALERT';
}

export async function POST(request: Request) {
  try {
    const session = await requireAuthentication(request);
    if (session.role === 'ADMIN') {
      return NextResponse.json({ success: true, message: 'Admin activity not tracked' });
    }
    
    const userId = session.userId;
    const body = await request.json();
    const { type, reasons = [], durationMs = 0, problemId } = body;

    await connectDB();

    // Ensure the participant summary exists
    let participantSummary = await ParticipantIntegrity.findOne({ userId });
    if (!participantSummary) {
      participantSummary = await ParticipantIntegrity.create({ userId });
    }

    if (type === 'START') {
      // Mark as away
      participantSummary.currentlyAway = true;
      participantSummary.currentAwayStartedAt = new Date();
      participantSummary.lastActivityAt = new Date();
      await participantSummary.save();

      await IntegrityLog.create({
        userId,
        type: 'AWAY_SESSION_START',
        reasons,
      });

      return NextResponse.json({ success: true, status: 'started' });
    } 
    
    if (type === 'END') {
      const severity = calculateSeverity(durationMs);
      const penalty = calculateScorePenalty(durationMs, reasons);
      
      const newScore = participantSummary.integrityScore + penalty;
      const newStatus = determineStatus(newScore);

      participantSummary.currentlyAway = false;
      participantSummary.currentAwayStartedAt = undefined;
      participantSummary.lastActivityAt = new Date();
      participantSummary.awaySessionCount += 1;
      
      let currentQuestionCount = participantSummary.awaySessionCount;
      if (problemId) {
        currentQuestionCount = (participantSummary.questionAwayCounts?.get(problemId) || 0) + 1;
        if (!participantSummary.questionAwayCounts) {
          participantSummary.questionAwayCounts = new Map();
        }
        participantSummary.questionAwayCounts.set(problemId, currentQuestionCount);
      }

      participantSummary.totalAwayTimeMs += durationMs;
      participantSummary.integrityScore = newScore;
      participantSummary.currentStatus = newStatus;
      
      if (durationMs > participantSummary.longestAwaySessionMs) {
        participantSummary.longestAwaySessionMs = durationMs;
      }
      if (reasons.includes('FULLSCREEN_EXIT')) {
        participantSummary.fullscreenExitCount += 1;
      }
      
      // Auto-lock check
      let autoLocked = false;
      const GlobalSettings = (await import('@/models/GlobalSettings')).default;
      const settings = await GlobalSettings.findOne();
      const maxSwitches = settings?.maxTabSwitches ?? 5;
      
      if (participantSummary.awaySessionCount >= maxSwitches && !participantSummary.isSubmissionsLocked) {
        participantSummary.isSubmissionsLocked = true;
        participantSummary.notes.push({
          adminId: userId as any,
          note: `SYSTEM: Automatically locked due to exceeding global max tab switches (${maxSwitches})`
        });
        autoLocked = true;
      }
      
      await participantSummary.save();

      await IntegrityLog.create({
        userId,
        type: 'AWAY_SESSION_END',
        reasons,
        durationMs,
        severity,
      });

      if (autoLocked) {
        await IntegrityLog.create({
          userId,
          type: 'ADMIN_ACTION',
          details: `SYSTEM: Submissions automatically locked (exceeded ${maxSwitches} tab switches)`,
          severity: 'HIGH',
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  } catch (error: any) {
    console.error('Integrity Activity Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
