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
      .populate({
        path: 'userId',
        select: 'username name email role teamId',
        match: { role: { $ne: 'ADMIN' } },
        populate: {
          path: 'teamId',
          select: 'status'
        }
      })
      .sort({ integrityScore: -1 })
      .lean();
      
    // Filter out summaries where userId is null (because they were admins)
    const participants = summaries.filter(s => s.userId != null);
    
    const totalTabSwitches = participants.reduce((sum, p) => sum + (p.awaySessionCount || 0), 0);
    const activeTeams = new Set();
    participants.forEach(p => {
      if ((p.userId as any)?.teamId) activeTeams.add((p.userId as any).teamId.toString());
    });
      
    return NextResponse.json({ 
      participants,
      stats: {
        totalTabSwitches,
        activeTeams: activeTeams.size
      }
    });
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
      participant.awaySessionCount = 0; // Reset so they don't immediately get locked again
      await participant.save();
      
      await IntegrityLog.create({
        userId,
        type: 'ADMIN_ACTION',
        details: 'Submissions Released (Tab Switches Reset)',
        severity: 'NONE'
      });
    } else if (action === 'DISQUALIFY' || action === 'READMIT') {
      const User = (await import('@/models/User')).default;
      const Team = (await import('@/models/Team')).default;
      
      const user = await User.findById(userId);
      if (user && user.teamId) {
        await Team.findByIdAndUpdate(user.teamId, {
          status: action === 'DISQUALIFY' ? 'DISQUALIFIED' : 'ACTIVE'
        });
        
        await IntegrityLog.create({
          userId,
          type: 'ADMIN_ACTION',
          details: action === 'DISQUALIFY' ? 'Team Disqualified' : 'Team Re-admitted',
          severity: action === 'DISQUALIFY' ? 'CRITICAL' : 'NONE'
        });
      }
    }
    
    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
