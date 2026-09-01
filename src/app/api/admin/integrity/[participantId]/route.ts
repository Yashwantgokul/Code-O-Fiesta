import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IntegrityLog from '@/models/IntegrityLog';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function GET(request: Request, { params }: { params: { participantId: string } }) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const logs = await IntegrityLog.find({ userId: params.participantId })
      .sort({ timestamp: -1 })
      .lean();
      
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
