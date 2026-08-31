import { NextRequest, NextResponse } from 'next/server';
import {
  getProblemById,
  buildSafeProblem,
} from '@/app/api/_services/problem.service';
import { roundService } from '@/app/api/_services/round.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const { problemId } = await params;

    const problem = await getProblemById(problemId);
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Round 2 statements are sensitive: do not rely on a client-side overlay
    // when Member 2 or either member during handover asks for a direct URL.
    if ((problem as any).roundNumber === 2) {
      const actor = await roundService.resolveActor(req);
      const scoped = { roundNumber: 2 as const, actor };
      await roundService.applyLazyPhaseHandover(scoped);
      const state = await roundService.getState(scoped);
      if (!state.allowedActions.canSeeProblem) {
        return NextResponse.json({ error: 'Problem statement is unavailable during this Round 2 phase.' }, { status: 403 });
      }
    }

    return NextResponse.json(buildSafeProblem(problem));
  } catch (err: unknown) {
    console.error('[GET /api/problems/[problemId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
