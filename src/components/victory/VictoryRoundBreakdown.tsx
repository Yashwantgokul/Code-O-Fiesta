'use client';

import React, { useState } from 'react';

export interface ProblemBreakdown {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  solved: boolean;
  bestTimeMs?: number;
  points: number;
}

export interface DetailedRound {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  completed: boolean;
  problems: ProblemBreakdown[];
}

interface VictoryRoundBreakdownProps {
  rounds?: DetailedRound[];
}

const DEFAULT_DETAILED_ROUNDS: DetailedRound[] = [
  {
    id: 'round-1',
    name: 'ROUND 1 · PATH OF FATE',
    score: 50,
    maxScore: 150,
    completed: true,
    problems: [
      { id: '1', title: 'Way Too Long Words', difficulty: 'MEDIUM', solved: true, bestTimeMs: 89, points: 50 },
      { id: '2', title: 'Paint House Matrix', difficulty: 'MEDIUM', solved: false, points: 0 },
      { id: '3', title: 'Dynamic Segment Chains', difficulty: 'HARD', solved: false, points: 0 },
    ],
  },
  {
    id: 'round-2',
    name: 'ROUND 2 · BLIND RELAY',
    score: 40,
    maxScore: 150,
    completed: true,
    problems: [
      { id: '1', title: 'Rotational String Logic', difficulty: 'EASY', solved: true, bestTimeMs: 142, points: 40 },
      { id: '2', title: 'Dual Thread Handoff', difficulty: 'MEDIUM', solved: false, points: 0 },
      { id: '3', title: 'Asynchronous Stream Filter', difficulty: 'HARD', solved: false, points: 0 },
    ],
  },
  {
    id: 'round-3',
    name: 'ROUND 3 · CONSTRAINT CRUCIBLE',
    score: 30,
    maxScore: 140,
    completed: true,
    problems: [
      { id: '1', title: 'Recursive Factor Matrix', difficulty: 'MEDIUM', solved: true, bestTimeMs: 110, points: 30 },
      { id: '2', title: 'Loopless Tree Search', difficulty: 'HARD', solved: false, points: 0 },
    ],
  },
];

export default function VictoryRoundBreakdown({ rounds = DEFAULT_DETAILED_ROUNDS }: VictoryRoundBreakdownProps) {
  // Open the first round by default
  const [openRounds, setOpenRounds] = useState<Record<string, boolean>>({
    'round-1': true,
    'round-2': false,
    'round-3': false,
  });

  const toggleRound = (id: string) => {
    setOpenRounds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getDifficultyBadge = (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HARD':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
          ROUND PERFORMANCE BREAKDOWN
        </h2>
        <span className="text-xs font-mono text-slate-500">
          Click any round to expand
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rounds.map((round, rIndex) => {
          const isOpen = openRounds[round.id] ?? false;

          return (
            <div
              key={round.id || rIndex}
              className="bg-[#111120] border border-purple-500/20 rounded-xl overflow-hidden shadow-md transition-all"
            >
              {/* Accordion header */}
              <button
                type="button"
                onClick={() => toggleRound(round.id)}
                className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[#151733] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 font-mono">
                  <span
                    className={`text-purple-400 transform transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : 'rotate-0'
                    }`}
                  >
                    ▶
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {round.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-purple-300 font-bold">
                    {round.score} / {round.maxScore} PTS
                  </span>
                  {round.completed && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>✓</span>
                      <span>COMPLETE</span>
                    </span>
                  )}
                </div>
              </button>

              {/* Accordion content */}
              {isOpen && (
                <div className="border-t border-[#1e224d] bg-[#0c0d1c] p-4 sm:p-5 overflow-x-auto">
                  {round.problems.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-2">
                      Per-problem breakdown isn&apos;t available for this round.
                    </p>
                  ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#1e224d] pb-2">
                        <th className="pb-2.5 font-bold">#</th>
                        <th className="pb-2.5 font-bold">PROBLEM TITLE</th>
                        <th className="pb-2.5 font-bold">DIFFICULTY</th>
                        <th className="pb-2.5 font-bold">STATUS</th>
                        <th className="pb-2.5 font-bold text-right">BEST TIME</th>
                        <th className="pb-2.5 font-bold text-right">POINTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181b3d]">
                      {round.problems.map((prob, pIndex) => (
                        <tr key={prob.id || pIndex} className="hover:bg-[#131535]/50 transition-colors">
                          <td className="py-3 text-slate-500 font-bold">
                            {String(pIndex + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3 font-semibold text-slate-200">
                            {prob.title}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyBadge(
                                prob.difficulty
                              )}`}
                            >
                              {prob.difficulty}
                            </span>
                          </td>
                          <td className="py-3">
                            {prob.solved ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                SOLVED
                              </span>
                            ) : (
                              <span className="text-slate-600 font-bold">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right text-slate-400">
                            {prob.bestTimeMs ? `${prob.bestTimeMs}ms` : '—'}
                          </td>
                          <td className="py-3 text-right font-bold">
                            {prob.solved ? (
                              <span className="text-emerald-400">+{prob.points} pts</span>
                            ) : (
                              <span className="text-slate-600">0 pts</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
