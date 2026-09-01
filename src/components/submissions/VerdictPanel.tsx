'use client';

import React from 'react';
import { SubmissionResult } from '@/types/submission';
import { IDEMode } from '@/types/problem';
import Round3ScoreCard from '@/components/round3/Round3ScoreCard';
import ScoreBreakdown from '@/components/round3/ScoreBreakdown';

interface VerdictPanelProps {
  submitResult: SubmissionResult | null;
  submissionCount: number;
  mode: IDEMode;
}

export default function VerdictPanel({ submitResult, submissionCount, mode }: VerdictPanelProps) {
  if (!submitResult) {
    return (
      <div className="flex items-center justify-center h-full min-h-[150px] text-[var(--text-muted)] font-mono text-xs">
        No submission results to show yet.
      </div>
    );
  }

  const {
    status,
    testsPassed,
    totalTests,
    timeMs,
    memoryKb,
    failedTest,
    compilerError,
    pointsEarned,
  } = submitResult;

  const isAccepted = status === 'accepted';

  // Shown on every non-accepted verdict so partial credit is never hidden
  // behind a plain "Wrong Answer" / error label.
  const testcaseScoreSummary = (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono font-bold text-purple-300 w-fit">
      <span>{testsPassed} / {totalTests} test cases passed</span>
      <span className="text-slate-600">·</span>
      <span>Points earned: {pointsEarned ?? 0}</span>
    </div>
  );

  // Render CSS confetti pieces if accepted
  const renderConfetti = () => {
    if (!isAccepted) return null;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
          }
          .confetti-piece {
            position: absolute;
            width: 6px;
            height: 12px;
            border-radius: 2px;
            animation: confettiFall 2.5s ease-out infinite;
          }
        `}} />
        {Array.from({ length: 20 }).map((_, i) => {
          const left = `${Math.random() * 100}%`;
          const delay = `${Math.random() * 2}s`;
          const color = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)];
          return (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left,
                animationDelay: delay,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (status) {
      case 'accepted':
        return (
          <div className="flex flex-col items-center text-center py-6 px-4 relative">
            {renderConfetti()}
            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-4 z-10 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-mono text-green-400 tracking-wider mb-1 z-10">
              ACCEPTED
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-4 z-10">
              All {totalTests} test cases passed successfully!
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-xs w-full bg-[#0a0a18] border border-[var(--border-subtle)] p-3 rounded-lg z-10 text-xs font-mono mb-4">
              <div className="text-left text-slate-400">Time Taken:</div>
              <div className="text-right text-white font-bold">{timeMs} ms</div>
              <div className="text-left text-slate-400">Memory Used:</div>
              <div className="text-right text-white font-bold">{memoryKb} KB</div>
            </div>

            {mode === 'constraint' ? (
              <div className="z-10 w-full flex flex-col items-center gap-3">
                <Round3ScoreCard submitResult={submitResult} submissionCount={submissionCount} />
                <ScoreBreakdown submitResult={submitResult} submissionCount={submissionCount} />
              </div>
            ) : (
              <div className="z-10 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono font-bold text-green-400">
                +{pointsEarned ?? 0} PTS EARNED
              </div>
            )}
          </div>
        );

      case 'wrong_answer':
        return (
          <div className="flex flex-col gap-4 py-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-red-400 uppercase tracking-wide">
                  Wrong Answer
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Failed on test case {failedTest ? failedTest.index : 'N/A'} ({testsPassed}/{totalTests} passed)
                </p>
              </div>
            </div>

            {testcaseScoreSummary}

            {failedTest && (
              <div className="flex flex-col gap-2.5 font-mono text-xs mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Input</span>
                  <pre className="p-3 bg-[#0a0a18] border border-[var(--border-subtle)] rounded text-slate-200 overflow-x-auto max-h-[80px]">
                    {failedTest.input.length > 100 ? `${failedTest.input.slice(0, 100)}...` : failedTest.input}
                  </pre>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-red-400 uppercase mb-1">Expected Output</span>
                    <pre className="p-3 bg-red-950/5 border border-red-500/10 rounded text-red-300 overflow-x-auto max-h-[80px]">
                      {failedTest.expected.length > 100 ? `${failedTest.expected.slice(0, 100)}...` : failedTest.expected}
                    </pre>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase mb-1">Actual Output</span>
                    <pre className="p-3 bg-[#0a0a18] border border-[var(--border-subtle)] rounded text-slate-200 overflow-x-auto max-h-[80px]">
                      {failedTest.actual.length > 100 ? `${failedTest.actual.slice(0, 100)}...` : failedTest.actual}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'time_limit_exceeded':
        return (
          <div className="flex flex-col gap-3 py-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wide">
                  Time Limit Exceeded
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Execution exceeded the allotted limit on test case {failedTest ? failedTest.index : 'N/A'}.
                </p>
              </div>
            </div>

            {testcaseScoreSummary}
          </div>
        );

      case 'compilation_error':
        return (
          <div className="flex flex-col gap-2.5 py-3 px-2 h-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-red-400 uppercase tracking-wide">
                  Compilation Error
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Your code failed to compile. View log details below.
                </p>
              </div>
            </div>

            {testcaseScoreSummary}

            <div className="flex-grow flex flex-col min-h-[120px]">
              <pre className="flex-grow p-4 bg-red-950/10 border border-red-500/10 rounded-lg text-red-400 overflow-auto text-xs whitespace-pre-wrap max-h-[300px]">
                {compilerError || 'Undefined compile error.'}
              </pre>
            </div>
          </div>
        );

      case 'runtime_error':
      default:
        return (
          <div className="flex flex-col gap-3 py-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-red-400 uppercase tracking-wide">
                  Runtime Error
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  A runtime exception occurred during execution.
                </p>
              </div>
            </div>

            {testcaseScoreSummary}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-[#060612] p-2 overflow-auto select-text">
      {renderContent()}
    </div>
  );
}
