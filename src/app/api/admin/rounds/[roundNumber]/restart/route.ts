import { NextRequest, NextResponse } from 'next/server';
import { restartRoundGlobally } from '@/app/api/_services/admin.service';
import { successResponse, errorResponse } from '@/app/api/_lib/response';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundNumber: string }> }
) {
  try {
    await requireAdmin(req);
    const resolvedParams = await params;
    const roundNumber = parseInt(resolvedParams.roundNumber, 10);
    if (isNaN(roundNumber)) {
      return NextResponse.json({ message: 'Invalid round number' }, { status: 400 });
    }
    const result = await restartRoundGlobally(roundNumber);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
