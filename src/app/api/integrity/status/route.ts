import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParticipantIntegrity from '@/models/ParticipantIntegrity';
import { requireAuthentication } from '@/app/api/_lib/authorization';

export async function GET(request: Request) {
  try {
    const session = await requireAuthentication(request);
    await connectDB();
    const status = await ParticipantIntegrity.findOne({ userId: session.userId }).select('isSubmissionsLocked awaySessionCount').lean();
    
    let isDisqualified = false;
    if (session.teamId) {
      const Team = (await import('@/models/Team')).default;
      const team = await Team.findById(session.teamId).select('status').lean();
      if (team?.status === 'DISQUALIFIED') {
        isDisqualified = true;
      }
    }
    
    return NextResponse.json({ 
      isSubmissionsLocked: status?.isSubmissionsLocked || false,
      awaySessionCount: status?.awaySessionCount || 0,
      isDisqualified,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
