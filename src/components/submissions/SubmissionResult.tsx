'use client';

import React from 'react';
import { SubmissionResult as TSubmissionResult } from '@/types/submission';
import SubmissionStatus from './SubmissionStatus';

interface SubmissionResultProps {
  submitResult: TSubmissionResult | null;
  isSubmitting: boolean;
  onViewFullVerdict?: () => void;
  mode?: string;
  submissionCount?: number;
}

export default function SubmissionResult({
  submitResult,
  isSubmitting,
  onViewFullVerdict,
  mode,
  submissionCount = 0,
}: SubmissionResultProps) {
  if (isSubmitting) {
    return (
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-purple-500/20 bg-purple-950/5 animate-pulse">
        <SubmissionStatus status="submitting" />
        <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
          Evaluating your code against all hidden test cases. Please wait...
        </p>
      </div>
    );
  }

  if (!submitResult) {
    return (
      <div className="flex items-center justify-center p-6 text-center text-[var(--text-muted)] font-mono text-xs">
        No active submission results. Write code and hit Submit!
      </div>
    );
  }

  const { status, testsPassed, totalTests, timeMs, memoryKb, pointsEarned } = submitResult;

  // Convert status to SubmissionStatus status type
  const inlineStatus = (() => {
    if (status === 'accepted') return 'accepted';
    if (status === 'wrong_answer') return 'wrong';
    if (status === 'compilation_error' || status === 'runtime_error' || status === 'time_limit_exceeded' || status === 'memory_limit_exceeded') return 'error';
    return 'idle';
  })();

  const isAccepted = status === 'accepted';

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 font-mono text-xs ${
      isAccepted 
        ? 'border-green-500/20 bg-green-950/5' 
        : 'border-red-500/20 bg-red-950/5'
    }`}>
      <div className="flex justify-between items-center">
        <SubmissionStatus status={inlineStatus} />
        {onViewFullVerdict && (
          <button
            onClick={onViewFullVerdict}
            type="button"
            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
          >
            View Full Verdict
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-[10px] text-[var(--text-secondary)] mt-1">
        <div>
          Test Cases: <span className="text-white font-bold">{testsPassed} / {totalTests} Passed</span>
        </div>
        {pointsEarned !== undefined && (
          <div>
            Points Earned: <span className="text-purple-300 font-bold">{pointsEarned}</span>
          </div>
        )}
        {timeMs !== undefined && (
          <div>
            Time: <span className="text-white font-bold">{timeMs} ms</span>
          </div>
        )}
        {memoryKb !== undefined && (
          <div>
            Memory: <span className="text-white font-bold">{memoryKb} KB</span>
          </div>
        )}
      </div>
    </div>
  );
}
