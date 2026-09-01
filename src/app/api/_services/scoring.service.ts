import { Types } from 'mongoose';
import connectDB from '@/lib/db';
import TeamRound from '@/models/TeamRound';
import Score from '@/models/Score';

/**
 * Shared partial-credit formula used by every coding round: each test case
 * is worth an equal share of the problem's base points, independent of
 * whether every test case passed.
 */
export function computeProportionalPoints(
  testsPassed: number,
  totalTests: number,
  basePoints: number,
): number {
  if (totalTests <= 0) return 0;
  const passed = Math.max(0, Math.min(testsPassed, totalTests));
  return Math.round((passed / totalTests) * basePoints);
}

/**
 * Persist a Round 1 / Round 2 submission's testcase-based score.
 *
 * Round 1 allows unlimited resubmission per problem, so we track the best
 * score ever achieved for that problem and never let a worse resubmission
 * reduce it — the team round's total score is the sum of each problem's
 * best score (recomputed here, not accumulated), which makes duplicate
 * polls of the same submission idempotent.
 *
 * Round 2 allows exactly one graded submission per question (enforced by
 * the relay's canSubmitCode gate), so once a question is COMPLETED this is
 * a no-op — that guard is what keeps duplicate polls from double-counting.
 */
export async function persistRound1And2Result(
  teamId: Types.ObjectId,
  roundId: Types.ObjectId,
  problemId: string,
  roundNumber: number,
  testsPassed: number,
  totalTests: number,
  basePoints = 50,
) {
  await connectDB();

  const teamRound = await TeamRound.findOne({ teamId, roundId });
  if (!teamRound) return;

  const pointsEarned = computeProportionalPoints(testsPassed, totalTests, basePoints);
  const isFullySolved = totalTests > 0 && testsPassed === totalTests;

  let totalScore: number | null = null;

  if (roundNumber === 1 && teamRound.round1?.problems) {
    const pIndex = teamRound.round1.problems.findIndex((p: any) => p.problemId?.toString() === problemId);
    if (pIndex === -1) return;

    const entry = teamRound.round1.problems[pIndex] as any;
    const previousBest = entry.bestScore ?? 0;
    const newBest = Math.max(previousBest, pointsEarned);

    if (newBest > previousBest) {
      teamRound.set(`round1.problems.${pIndex}.bestScore`, newBest);
    }
    if (isFullySolved) {
      teamRound.set(`round1.problems.${pIndex}.status`, 'SOLVED');
    } else if (entry.status !== 'SOLVED') {
      teamRound.set(`round1.problems.${pIndex}.status`, 'IN_PROGRESS');
    }

    // Only write if something actually changed — avoids a DB write on every
    // repeat poll of an already-recorded submission.
    if (newBest > previousBest || (isFullySolved && entry.status !== 'SOLVED')) {
      const updatedProblems = teamRound.round1?.problems ?? [];
      totalScore = updatedProblems.reduce(
        (sum: number, p: any, i: number) => sum + (i === pIndex ? newBest : (p.bestScore ?? 0)),
        0,
      );
      teamRound.score = totalScore;
      await teamRound.save();
    }
  } else if (roundNumber === 2 && teamRound.round2?.questions) {
    const qIndex = teamRound.round2.questions.findIndex((q: any) => q.problemId?.toString() === problemId);
    if (qIndex === -1) return;

    const entry = teamRound.round2.questions[qIndex] as any;
    // Already graded (only one graded submission is possible per question) —
    // this is what makes duplicate polls of the same submission idempotent.
    if (entry.status === 'COMPLETED') return;

    teamRound.set(`round2.questions.${qIndex}.score`, pointsEarned);
    teamRound.set(`round2.questions.${qIndex}.status`, 'COMPLETED');

    const updatedQuestions = teamRound.round2?.questions ?? [];
    totalScore = updatedQuestions.reduce(
      (sum: number, q: any, i: number) => sum + (i === qIndex ? pointsEarned : (q.score ?? 0)),
      0,
    );
    teamRound.score = totalScore;
    await teamRound.save();
  } else {
    return;
  }

  if (totalScore === null) return;

  // Keep the detailed Score document (used by the leaderboard) in sync —
  // set to the freshly recomputed total rather than accumulating, so
  // duplicate polls/resubmissions can never double-count.
  let scoreDoc = await Score.findOne({ teamId, roundId });
  if (!scoreDoc) {
    scoreDoc = new Score({ teamId, roundId, baseScore: 0, bonusScore: 0, totalScore: 0 });
  }
  scoreDoc.baseScore = totalScore;
  scoreDoc.totalScore = totalScore;
  await scoreDoc.save();
}
