import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Problem from '@/models/Problem';
import Round from '@/models/Round';
import mongoose from 'mongoose';
import { RoundStatus } from '@/constants/event';
import { executeTestCases, calculateVerdict, ExecutionMode } from '../../_services/judge.service';
import { roundService } from '@/app/api/_services/round.service';
import { requireAuthentication } from '../../_lib/authorization';

const COOLDOWN_SECONDS = 5;

/**
 * MongoDB-backed rate limit record. A TTL index on `expiresAt` removes the
 * document automatically once the cooldown window lapses. This works across
 * multiple Next.js workers and never leaks memory.
 */
function getRunRateLimitModel() {
  if (mongoose.models.RunRateLimit) {
    return mongoose.models.RunRateLimit;
  }
  const schema = new mongoose.Schema(
    {
      _id: { type: String }, // userId or IP
      expiresAt: { type: Date, required: true },
    },
    { collection: 'run_rate_limits' },
  );
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return mongoose.model('RunRateLimit', schema);
}

async function isRateLimited(key: string): Promise<boolean> {
  const RunRateLimit = getRunRateLimitModel();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COOLDOWN_SECONDS * 1000);

  try {
    const doc = await RunRateLimit.findById(key);
    
    if (doc) {
      if (doc.expiresAt > now) {
        return true; // Rate limited
      }
      
      // Logically expired but TTL hasn't cleaned it up yet. Update it.
      await RunRateLimit.updateOne({ _id: key }, { $set: { expiresAt } });
      return false; // Allowed
    }
    
    // Doesn't exist, insert new
    await RunRateLimit.create({ _id: key, expiresAt });
    return false; // Allowed
  } catch (err: any) {
    if (err.code === 11000) {
      return true; // Concurrent insert, treat as rate limited
    }
    throw err;
  }
}

export async function POST(request: Request) {
  const t0 = performance.now();
  
  try {
    // ── Authentication ─────────────────────────────────────────────────────
    // requireAuthentication throws UnauthorizedError (401) if no valid session
    // exists, preventing anonymous code execution on the Judge0 cluster.
    const session = await requireAuthentication(request);
    // ───────────────────────────────────────────────────────────────────────

    // ── Rate Limiting (MongoDB TTL — works across workers, no memory leak) ─
    await connectDB();
    const rateLimitKey = session.userId;
    const limited = await isRateLimited(rateLimitKey);
    if (limited) {
      return NextResponse.json(
        { error: `Please wait ${COOLDOWN_SECONDS} seconds before running again.` },
        { status: 429 }
      );
    }
    // ───────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const { code, language, customInput, problemId, mode = 'custom', roundNumber } = body;
    if (roundNumber === 2) {
      const actor = await roundService.resolveActor(request);
      // For both "run examples" and "custom" modes, allow anytime user can edit code
      // Only require submit permissions for actual submission
      // Remove this check entirely since run modes should always be allowed for testing
    }
    const tParsed = performance.now();

    let cpuTimeLimit = 2.0;
    let memoryLimit = 128000;
    let testCases: { input: string; expectedOutput?: string }[] = [];

    if (mode === 'custom') {
      testCases = [{ input: customInput || '' }];
    }

    let tDbStart = performance.now();
    let tDbEnd = tDbStart;

    if (problemId && process.env.MONGODB_URI) {
      try {
        tDbStart = performance.now();
        await connectDB();
        const problem = await Problem.findById(problemId);
        tDbEnd = performance.now();
        if (problem) {
          const round = await Round.findOne({ roundNumber: problem.roundNumber }).select('status').lean();
          if (round?.status !== RoundStatus.ACTIVE) {
            return NextResponse.json(
              { error: `Round ${problem.roundNumber} is not currently active` },
              { status: 403 },
            );
          }

          cpuTimeLimit = problem.cpuTimeLimit || 2.0;
          memoryLimit = problem.memoryLimit || 128000;

          if (mode === 'examples') {
            // Priority: visibleTestCases then examples
            const visible = problem.visibleTestCases || [];
            if (visible.length > 0) {
              testCases = visible;
            } else if (problem.examples && problem.examples.length > 0) {
              testCases = problem.examples.map(ex => ({
                input: ex.input,
                expectedOutput: ex.output,
              }));
            }
          }
        }
      } catch (e) {
        tDbEnd = performance.now();
        console.error('Error fetching problem details for run:', e);
      }
    }

    if (testCases.length === 0 && mode === 'examples') {
      // Fallback if DB failed or no examples exist
      testCases = [{ input: '4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis', expectedOutput: 'word\nl10n\ni18n\np43s' }];
    }

    const tJudgeStart = performance.now();
    const results = await executeTestCases({
      sourceCode: code,
      language,
      testCases,
      cpuTimeLimit,
      memoryLimit,
      mode: mode as ExecutionMode,
    });
    const tJudgeEnd = performance.now();

    const _timings = {
      totalMs: Math.round(performance.now() - t0),
      parseMs: Math.round(tParsed - t0),
      mongoMs: Math.round(tDbEnd - tDbStart),
      judge0Ms: Math.round(tJudgeEnd - tJudgeStart),
      testCaseCount: testCases.length,
      language,
      mode,
    };

    console.log('[RUN TIMINGS]', JSON.stringify(_timings));

    if (mode === 'custom') {
      const res = results[0];
      return NextResponse.json({
        mode: 'custom',
        status: res.verdict === 'COMPILATION_ERROR' || res.verdict === 'RUNTIME_ERROR' || res.verdict === 'TIME_LIMIT_EXCEEDED' ? res.verdict : 'SUCCESS',
        verdict: res.verdict,
        stdout: res.actualOutput,
        stderr: res.stderr,
        compileOutput: res.compileOutput,
        executionTime: res.executionTime,
        memory: res.memory,
        _timings,
      });
    }

    const verdict = calculateVerdict(results);
    const passed = results.filter(r => r.verdict === 'ACCEPTED').length;

    return NextResponse.json({
      mode: 'examples',
      verdict,
      passed,
      total: results.length,
      cases: results,
      _timings,
    });

  } catch (err: any) {
    console.error('Judge0 Run Error:', err);
    return NextResponse.json({ error: err.message, _timings: { totalMs: Math.round(performance.now() - t0) } }, { status: 500 });
  }
}
