import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/_lib/authorization';
import { errorResponse, successResponse } from '@/app/api/_lib/response';
import { round2ConfigSchema } from '@/app/api/_validators/admin';
import connectDB from '@/lib/db';
import Round from '@/models/Round';
import { roundService } from '@/app/api/_services/round.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serialize(round: any) {
  const config = round.configuration?.round2 ?? {};
  return {
    totalDurationSeconds: round.durationSeconds,
    member1DurationSeconds: config.member1DurationSeconds ?? 10 * 60,
    handoverDurationSeconds: config.handoverDurationSeconds ?? 2 * 60,
    member2DurationSeconds: config.member2DurationSeconds ?? 15 * 60,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    const round = await Round.findOne({ roundNumber: 2 }).lean();
    if (!round) return NextResponse.json({ message: 'Round 2 is not configured.' }, { status: 404 });
    return successResponse(serialize(round));
  } catch (error: any) {
    return errorResponse(error.message, error.status || 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const input = round2ConfigSchema.parse(await request.json());
    await connectDB();
    const round = await Round.findOne({ roundNumber: 2 });
    if (!round) return NextResponse.json({ message: 'Round 2 is not configured.' }, { status: 404 });
    round.durationSeconds = input.totalDurationSeconds;
    const configuration = (round.configuration ?? {}) as NonNullable<typeof round.configuration>;
    round.configuration = configuration;
    configuration.round2 = {
      ...(configuration.round2 ?? {}),
      member1DurationSeconds: input.member1DurationSeconds,
      handoverDurationSeconds: input.handoverDurationSeconds,
      member2DurationSeconds: input.member2DurationSeconds,
    };
    await round.save();
    await roundService.updateActiveTiming(round._id, input);
    return successResponse(serialize(round));
  } catch (error: any) {
    const message = error?.issues?.[0]?.message ?? error.message;
    return errorResponse(message, error.status || 400);
  }
}
