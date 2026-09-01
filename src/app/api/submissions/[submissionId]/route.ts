import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

import connectDB from '@/lib/db';
import Submission from '@/models/Submission';
import Round from '@/models/Round';
import { getBatchSubmissions, Judge0Result } from '@/lib/judge0';
import { requireAuthentication } from '@/app/api/_lib/authorization';
import { SubmissionVerdict } from '@/constants/event';
import {
  computeRound3Result,
  persistRound3ProblemResult,
} from '@/app/api/_services/round3.service';
import { computeProportionalPoints } from '@/app/api/_services/scoring.service';

declare global {
  var submissionCache:
    | Map<
        string,
        {
          code: string;
          language: string;
          problemId: string;
          roundNumber?: number;
          tokens?: string[];
          astResult?: any;
          teamId?: string;
          userId?: string;
          roundId?: string;
          isFirstAttempt?: boolean;
        }
      >
    | undefined;
}

function mapJudge0StatusToIDEStatus(statusId: number): string {
  if (statusId <= 2) return 'processing';
  if (statusId === 3) return 'accepted';
  if (statusId === 4) return 'wrong_answer';
  if (statusId === 5) return 'time_limit_exceeded';
  if (statusId === 6) return 'compilation_error';
  if (statusId >= 7 && statusId <= 12) return 'runtime_error';
  return 'wrong_answer';
}

function mapToVerdictEnum(status: string): SubmissionVerdict {
  switch (status) {
    case 'accepted':
      return SubmissionVerdict.ACCEPTED;
    case 'wrong_answer':
      return SubmissionVerdict.WRONG_ANSWER;
    case 'time_limit_exceeded':
      return SubmissionVerdict.TIME_LIMIT;
    case 'memory_limit_exceeded':
      return SubmissionVerdict.MEMORY_LIMIT;
    case 'compilation_error':
      return SubmissionVerdict.COMPILATION_ERROR;
    case 'runtime_error':
      return SubmissionVerdict.RUNTIME_ERROR;
    default:
      return SubmissionVerdict.PENDING;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const session = await requireAuthentication(request);
    const teamId = session.teamId;

    const { submissionId } = await params;

    let tokens: string[] = [];
    let dbSubmission: any = null;
    let isDb = false;
    let cachedMeta: any = undefined;

    await connectDB();

    // 1. Fetch from DB
    if (Types.ObjectId.isValid(submissionId)) {
      try {
        dbSubmission = await Submission.findById(submissionId);
        if (dbSubmission && dbSubmission.judge0?.token) {
          tokens = dbSubmission.judge0.token.split(',').filter(Boolean);
          isDb = true;
        }
      } catch (dbErr) {
        console.error('Failed to query submission from DB:', dbErr);
      }
    }

    // 2. Fallback to memory cache
    if (tokens.length === 0 && globalThis.submissionCache) {
      cachedMeta = globalThis.submissionCache.get(submissionId);
      if (cachedMeta?.tokens) {
        tokens = cachedMeta.tokens;
      }
    }

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found or has no tokens' },
        { status: 404 },
      );
    }

    // 3. Poll Judge0
    const { submissions } = await getBatchSubmissions(tokens);

    let status = 'accepted';
    let testsPassed = 0;
    const totalTests = submissions.length;
    let maxTimeMs = 0;
    let maxMemoryKb = 0;
    let compilerError: string | undefined;
    let failedTest: any = null;

    const decodeBase64 = (str: string | null) =>
      str ? Buffer.from(str, 'base64').toString('utf-8') : '';

    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      const subStatus = mapJudge0StatusToIDEStatus(sub.status.id);

      const timeMs = parseFloat(sub.time || '0') * 1000;
      const memKb = sub.memory || 0;
      if (timeMs > maxTimeMs) maxTimeMs = timeMs;
      if (memKb > maxMemoryKb) maxMemoryKb = memKb;

      if (subStatus === 'processing') {
        return NextResponse.json({
          id: submissionId,
          status: 'processing',
          testsPassed: 0,
          totalTests: 0,
          timeMs: 0,
          memoryKb: 0,
          pointsEarned: 0,
          constraintViolations: [],
        });
      }

      if (subStatus === 'accepted') {
        testsPassed++;
      } else if (status === 'accepted') {
        status = subStatus;
        if (subStatus === 'compilation_error') {
          compilerError =
            decodeBase64(sub.compile_output || sub.stderr || sub.message) || 'Compilation Error';
        } else if (subStatus === 'runtime_error') {
          compilerError = decodeBase64(sub.stderr || sub.message) || 'Runtime Error';
        } else if (subStatus === 'wrong_answer') {
          failedTest = {
            index: i + 1,
            input: 'Hidden Test Case',
            expected: 'Expected Output',
            actual: decodeBase64(sub.stdout) || '(empty)',
          };
        }
      }
    }

    // 4. Update DB verdict
    if (isDb && dbSubmission && dbSubmission.verdict === SubmissionVerdict.PENDING) {
      dbSubmission.verdict = mapToVerdictEnum(status);
      dbSubmission.judge0 = {
        ...dbSubmission.judge0,
        statusId: submissions[0]?.status?.id,
        status,
        executionTime: maxTimeMs,
        memory: maxMemoryKb,
        compileOutput: compilerError,
      };
      await dbSubmission.save();
    }

    // 5. Round 3 constraint processing (only on ACCEPTED verdict)
    const roundNumber =
      dbSubmission?.roundNumber ?? cachedMeta?.roundNumber ?? null;

    // Resolve roundNumber from submission's roundId if not in cache
    let resolvedRoundNumber = roundNumber;
    if (!resolvedRoundNumber && isDb && dbSubmission?.roundId) {
      try {
        const round = await Round.findById(dbSubmission.roundId).select('roundNumber').lean();
        resolvedRoundNumber = (round as any)?.roundNumber ?? null;
      } catch (_) {}
    }

    // Every round awards testcase-proportional partial credit — passing some
    // (but not all) test cases is never worth zero points. `status` still
    // reflects the verdict (accepted / wrong_answer / etc.) for display, but
    // pointsEarned below is always derived from testsPassed / totalTests.
    const constraintViolations: { constraintId: string; message: string }[] = [];
    let pointsEarned = computeProportionalPoints(testsPassed, totalTests);

    const effectiveTeamId = teamId ?? cachedMeta?.teamId ?? (isDb ? dbSubmission?.teamId?.toString() : null);
    const effectiveRoundId = cachedMeta?.roundId ?? (isDb ? dbSubmission?.roundId?.toString() : null);
    const effectiveProblemId = cachedMeta?.problemId ?? (isDb ? dbSubmission?.problemId?.toString() : null);

    if (resolvedRoundNumber === 3) {
      // Get AST result and metadata
      const ast = isDb
        ? dbSubmission?.astAnalysis
        : cachedMeta?.astResult;

      const isFirstAttempt =
        cachedMeta?.isFirstAttempt ??
        (isDb ? dbSubmission?.submissionNumber <= 1 : true);

      // Get round config for bonus point values (base score is always
      // testsPassed x POINTS_PER_TEST_CASE, not admin-configurable)
      let ouroborosPoints = 30;
      let shortAndSweetPoints = 20;
      let oneShotWonderPoints = 40;
      let maxLines = 30;

      if (effectiveRoundId) {
        try {
          const round = await Round.findById(effectiveRoundId).lean() as any;
          ouroborosPoints = round?.configuration?.round3?.ouroborosPoints ?? 30;
          shortAndSweetPoints = round?.configuration?.round3?.shortAndSweetPoints ?? 20;
          oneShotWonderPoints = round?.configuration?.round3?.oneShotWonderPoints ?? 40;
          maxLines = round?.configuration?.round3?.maxLines ?? 30;
        } catch (_) {}
      }

      const result = computeRound3Result(
        testsPassed,
        totalTests,
        ast,
        isFirstAttempt,
        maxLines,
        ouroborosPoints,
        shortAndSweetPoints,
        oneShotWonderPoints,
      );

      pointsEarned = result.pointsEarned;
      constraintViolations.push(...result.constraintViolations);

      // Persist to TeamRound.round3 — this is the source of truth. It freezes
      // the "First Submit" bonus based on the team's literal first submission
      // and always recomputes Short & Sweet / Recursion from this submission,
      // so the response below must reflect what was actually persisted rather
      // than this submission's isolated (unfrozen) computation.
      if (effectiveTeamId && effectiveRoundId && effectiveProblemId) {
        try {
          const persisted = await persistRound3ProblemResult(
            new Types.ObjectId(effectiveTeamId),
            new Types.ObjectId(effectiveRoundId),
            effectiveProblemId,
            result,
            { ouroborosPoints, shortAndSweetPoints, oneShotWonderPoints },
          );

          if (persisted) {
            pointsEarned = persisted.pointsEarned;
            constraintViolations.length = 0;
            constraintViolations.push(...persisted.constraintViolations);
          }
        } catch (e) {
          console.error('Failed to persist round3 result:', e);
        }
      }
    } else if (resolvedRoundNumber === 1 || resolvedRoundNumber === 2) {
      pointsEarned = computeProportionalPoints(testsPassed, totalTests);

      if (effectiveTeamId && effectiveRoundId && effectiveProblemId) {
        try {
          const { persistRound1And2Result } = await import('../../_services/scoring.service');
          await persistRound1And2Result(
            new Types.ObjectId(effectiveTeamId),
            new Types.ObjectId(effectiveRoundId),
            effectiveProblemId,
            resolvedRoundNumber,
            testsPassed,
            totalTests,
          );
        } catch (e) {
          console.error('Failed to persist round 1/2 result:', e);
        }
      }
    }

    return NextResponse.json({
      id: submissionId,
      status,
      testsPassed,
      totalTests,
      timeMs: maxTimeMs,
      memoryKb: maxMemoryKb,
      pointsEarned,
      compilerError,
      failedTest,
      constraintViolations,
    });
  } catch (err: any) {
    console.error('Judge0 polling error:', err);
    const status = err?.status ?? 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
