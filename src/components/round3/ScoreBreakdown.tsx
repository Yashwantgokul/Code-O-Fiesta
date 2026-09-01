import React from 'react';
import { SubmissionResult } from '@/types/submission';

interface ScoreBreakdownProps {
  submitResult: SubmissionResult;
  submissionCount?: number;
}

export default function ScoreBreakdown({ submitResult }: ScoreBreakdownProps) {
  const violations = submitResult.constraintViolations || [];
  const isAccepted = submitResult.status === 'accepted';

  if (!isAccepted) return null;

  const ouroborosViolated = violations.some(v =>
    v.constraintId === 'ouroboros' ||
    v.constraintId === 'no-loops' ||
    v.constraintId === 'recursion-required'
  );
  const ouroborosPoints = ouroborosViolated ? 0 : 30;

  const shortViolated = violations.some(v =>
    v.constraintId === 'shortAndSweet' ||
    v.constraintId === 'max-lines' ||
    v.constraintId === 'line-count'
  );
  const shortPoints = shortViolated ? 0 : 20;

  // First Submit is frozen by the backend on the team's literal first
  // submission attempt — read it from constraintViolations, don't recompute
  // it from submissionCount (that would flip on every resubmission).
  const oneShotViolated = violations.some(v =>
    v.constraintId === 'oneShotWonder' ||
    v.constraintId === 'one-shot-wonder'
  );
  const oneShotPoints = oneShotViolated ? 0 : 40;

  // Total and base score come from the backend's authoritative pointsEarned
  // (10 pts / test case) — base points vary with the problem's test count.
  const totalPoints = submitResult.pointsEarned ?? 0;
  const baseSolvePoints = Math.max(0, totalPoints - ouroborosPoints - shortPoints - oneShotPoints);

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#080814] border border-cyan-500/20 rounded-lg max-w-sm mt-3 font-mono text-[11px]">
      <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1">
        Scoring Math (Crucible Round)
      </div>
      <div className="flex items-center gap-1.5 text-slate-300 flex-wrap">
        <span>{baseSolvePoints} (Base: {submitResult.testsPassed}/{submitResult.totalTests} tests)</span>
        <span>+</span>
        <span className={ouroborosViolated ? 'line-through text-red-500/60' : 'text-green-400'}>30 (Ouroboros)</span>
        <span>+</span>
        <span className={shortViolated ? 'line-through text-red-500/60' : 'text-green-400'}>20 (Short)</span>
        <span>+</span>
        <span className={oneShotViolated ? 'line-through text-red-500/60' : 'text-green-400'}>40 (One-Shot)</span>
        <span>=</span>
        <span className="text-white font-bold">{totalPoints} PTS</span>
      </div>
    </div>
  );
}
