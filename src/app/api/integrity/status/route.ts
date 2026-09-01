import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParticipantIntegrity from '@/models/ParticipantIntegrity';
import { requireAuthentication } from '@/app/api/_lib/authorization';

export async function GET(request: Request) {
  try {
    const session = await requireAuthentication(request);
    await connectDB();
    const status = await ParticipantIntegrity.findOne({ userId: session.userId }).select('isSubmissionsLocked').lean();
    return NextResponse.json({ isSubmissionsLocked: status?.isSubmissionsLocked || false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
