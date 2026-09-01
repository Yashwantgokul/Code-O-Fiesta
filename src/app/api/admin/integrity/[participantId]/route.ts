import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import IntegrityLog from '@/models/IntegrityLog';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function GET(request: Request, props: { params: Promise<{ participantId: string }> }) {
  try {
    const params = await props.params;
    await requireAdmin(request);
    await connectDB();
    
    const logs = await IntegrityLog.find({ userId: params.participantId })
      .sort({ timestamp: -1 })
      .lean();
      
    console.log(`[API] Fetched logs for ${params.participantId}: found ${logs.length}`);
      
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
