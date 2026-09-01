import React from 'react';
import { SubmissionResult } from '@/types/submission';

interface Round3ScoreCardProps {
  submitResult: SubmissionResult;
  submissionCount?: number;
}

export default function Round3ScoreCard({ submitResult }: Round3ScoreCardProps) {
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

  // First Submit is a historical constraint frozen by the backend on the
  // team's literal first submission — read it from the authoritative
  // constraintViolations list, never recompute it from submissionCount here.
  const oneShotViolated = violations.some(v =>
    v.constraintId === 'oneShotWonder' ||
    v.constraintId === 'one-shot-wonder'
  );
  const oneShotPoints = oneShotViolated ? 0 : 40;

  // Total and base score are read from the backend's authoritative
  // pointsEarned (10 pts / test case) rather than a hardcoded flat value —
  // base points vary with how many test cases the problem has.
  const totalPoints = submitResult.pointsEarned ?? 0;
  const baseSolvePoints = Math.max(0, totalPoints - ouroborosPoints - shortPoints - oneShotPoints);
  const maxBasePoints = (submitResult.totalTests ?? 0) * 10;
  const maxTotalPoints = maxBasePoints + 30 + 20 + 40;

  return (
    <div className="p-5 rounded-xl border border-purple-500/30 bg-purple-950/10 shadow-[0_0_20px_rgba(139,92,246,0.2)] max-w-md w-full">
      <h3 className="text-sm font-mono font-bold text-purple-300 uppercase tracking-wider mb-4 border-b border-purple-500/20 pb-2 flex justify-between">
        <span>Crucible Scorecard</span>
        <span className="text-green-400 font-extrabold">{totalPoints} / {maxTotalPoints} PTS</span>
      </h3>

      <div className="flex flex-col gap-2 font-mono text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Base Problem Solve ({submitResult.testsPassed}/{submitResult.totalTests} tests x 10 pts):</span>
          <span className="text-green-400 font-bold">+{baseSolvePoints} PTS</span>
        </div>

        <div className="flex justify-between items-center py-1 border-t border-purple-500/10">
          <span className="text-slate-400">Ouroboros (Recursion, No Loops):</span>
          {ouroborosPoints > 0 ? (
            <span className="text-green-400 font-bold">+{ouroborosPoints} PTS</span>
          ) : (
            <span className="text-red-400/50 line-through">+{30} PTS</span>
          )}
        </div>

        <div className="flex justify-between items-center py-1 border-t border-purple-500/10">
          <span className="text-slate-400">Short & Sweet (Length Limit):</span>
          {shortPoints > 0 ? (
            <span className="text-green-400 font-bold">+{shortPoints} PTS</span>
          ) : (
            <span className="text-red-400/50 line-through">+{20} PTS</span>
          )}
        </div>

        <div className="flex justify-between items-center py-1 border-t border-purple-500/10">
          <span className="text-slate-400">One Shot Wonder (First Try AC):</span>
          {oneShotPoints > 0 ? (
            <span className="text-green-400 font-bold">+{oneShotPoints} PTS</span>
          ) : (
            <span className="text-red-400/50 line-through">+{40} PTS</span>
          )}
        </div>
      </div>
    </div>
  );
}
