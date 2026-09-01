import { NextRequest } from 'next/server';
import { getLeaderboard } from '@/app/api/_services/leaderboard.service';
import { successResponse, errorResponse } from '@/app/api/_lib/response';
import { requireAdmin } from '@/app/api/_lib/authorization';

// Full standings are admin-only. Participants get their own rank via
// /api/results/me, which never exposes other teams' data.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const leaderboard = await getLeaderboard(false);
    return successResponse(leaderboard);
  } catch (error) {
    return errorResponse(error);
  }
}
