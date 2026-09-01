import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';
import IntegrityLog from '@/models/IntegrityLog';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = await request.json();
    const { strictMode, copyPasteBlocker, maxTabSwitches, reason } = body;
    
    await connectDB();
    
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = new GlobalSettings({ strictMode: true, copyPasteBlocker: false, maxTabSwitches: 5 });
    }
    
    if (strictMode !== undefined && strictMode !== settings.strictMode) {
      settings.strictMode = strictMode;
      
      await IntegrityLog.create({
        userId: session.userId,
        type: 'ADMIN_ACTION',
        details: `STRICT_MODE_${strictMode ? 'ENABLED' : 'DISABLED'}: ${reason || 'Admin toggled strict mode'}`,
        severity: 'NONE'
      });
    }
    
    if (copyPasteBlocker !== undefined && copyPasteBlocker !== settings.copyPasteBlocker) {
      settings.copyPasteBlocker = copyPasteBlocker;
      
      await IntegrityLog.create({
        userId: session.userId,
        type: 'ADMIN_ACTION',
        details: `COPY_PASTE_BLOCKER_${copyPasteBlocker ? 'ENABLED' : 'DISABLED'}: Admin toggled copy-paste blocker`,
        severity: 'NONE'
      });
    }

    if (maxTabSwitches !== undefined && maxTabSwitches !== settings.maxTabSwitches) {
      const oldVal = settings.maxTabSwitches;
      settings.maxTabSwitches = maxTabSwitches;
      
      await IntegrityLog.create({
        userId: session.userId,
        type: 'ADMIN_ACTION',
        details: `MAX_TAB_SWITCHES_CHANGED: Admin changed max tab switches from ${oldVal} to ${maxTabSwitches}`,
        severity: 'NONE'
      });
    }
    
    await settings.save();
    
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
