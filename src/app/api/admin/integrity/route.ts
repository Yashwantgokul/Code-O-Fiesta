import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParticipantIntegrity from '@/models/ParticipantIntegrity';
import IntegrityLog from '@/models/IntegrityLog';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const summaries = await ParticipantIntegrity.find()
      .populate('userId', 'username name email')
      .sort({ integrityScore: -1 })
      .lean();
      
    return NextResponse.json({ participants: summaries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = await request.json();
    const { action, userId, note, reason } = body;
    
    await connectDB();
    
    const participant = await ParticipantIntegrity.findOne({ userId });
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    if (action === 'MARK_REVIEWED') {
      participant.currentStatus = 'NORMAL';
      participant.integrityScore = 0; // Reset score on review
      if (note) {
        participant.notes.push({ adminId: session.userId as any, note });
      }
      await participant.save();
      
      await IntegrityLog.create({
        userId,
        type: 'ADMIN_ACTION',
        details: 'Marked as reviewed',
        severity: 'NONE'
      });
    } else if (action === 'LOCK_SUBMISSIONS') {
      participant.isSubmissionsLocked = true;
      if (reason) {
         participant.notes.push({ adminId: session.userId as any, note: reason });
      }
      await participant.save();
      
      await IntegrityLog.create({
        userId,
        type: 'ADMIN_ACTION',
        details: 'Submissions Locked: ' + (reason || ''),
        severity: 'HIGH'
      });
    } else if (action === 'RELEASE_SUBMISSIONS') {
      participant.isSubmissionsLocked = false;
      await participant.save();
      
      await IntegrityLog.create({
        userId,
        type: 'ADMIN_ACTION',
        details: 'Submissions Released',
        severity: 'NONE'
      });
    }
    
    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
