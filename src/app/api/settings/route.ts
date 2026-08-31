import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    let settings = await GlobalSettings.findOne().lean();
    
    if (!settings) {
      settings = await GlobalSettings.create({ strictMode: true, copyPasteBlocker: false });
    }
    
    return NextResponse.json({
      strictMode: settings.strictMode,
      copyPasteBlocker: settings.copyPasteBlocker
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
