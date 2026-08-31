import { z } from 'zod';
import { RoundStatus } from '@/constants/event';

export const overrideRoundStateSchema = z.object({
  status: z
    .enum([RoundStatus.UPCOMING, RoundStatus.ACTIVE, RoundStatus.PAUSED, RoundStatus.COMPLETED])
    .optional(),
  durationSeconds: z.number().positive().optional(),
});

export const round2ConfigSchema = z.object({
  totalDurationSeconds: z.number().int().positive().max(24 * 60 * 60),
  member1DurationSeconds: z.number().int().positive().max(12 * 60 * 60),
  handoverDurationSeconds: z.number().int().min(0).max(60 * 60),
  member2DurationSeconds: z.number().int().positive().max(12 * 60 * 60),
});
