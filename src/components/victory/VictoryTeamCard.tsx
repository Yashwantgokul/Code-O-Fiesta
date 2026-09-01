'use client';

import React from 'react';

export interface RoundSummary {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  completed: boolean;
}

interface VictoryTeamCardProps {
  teamId: string;
  memberNames: string[];
  finalScore: number;
  roundsDone?: string;
  roundSummaries?: RoundSummary[];
}

const DEFAULT_ROUND_SUMMARIES: RoundSummary[] = [
  { id: '1', name: 'Round 1: Path of Fate', score: 50, maxScore: 50, completed: true },
  { id: '2', name: 'Round 2: Blind Relay', score: 40, maxScore: 40, completed: true },
  { id: '3', name: 'Round 3: Constraint Crucible', score: 30, maxScore: 50, completed: true },
];

export default function VictoryTeamCard({
  teamId,
  memberNames = ['Member 01', 'Member 02'],
  finalScore,
  roundsDone = '3 / 3',
  roundSummaries = DEFAULT_ROUND_SUMMARIES,
}: VictoryTeamCardProps) {
  const safeTeamName = teamId || 'TEAM_014';

  return (
    <div className="bg-[#111120] border border-purple-500/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl relative">
      {/* Header bar */}
      <div className="border-b border-[#1e224d] pb-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>YOUR TEAM CERTIFICATE</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Official proof of completion and arena victory
        </p>
      </div>

      {/* Certificate card */}
      <div className="flex justify-center w-full">
        <div
          id="team-victory-card"
          className="victory-export-card w-full max-w-2xl rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6 text-white font-mono"
        >
          {/* Card Top Brand & Event ID */}
          <div className="victory-export-topbar flex items-center justify-between pb-3 text-xs tracking-wider">
            <div className="flex items-center gap-2">
              <span className="victory-export-brand font-bold">&lt;/&gt;</span>
              <span className="victory-export-title font-extrabold tracking-widest">
                CODE-O-FIESTA<span className="victory-export-brand">_</span>
              </span>
            </div>
            <span className="victory-export-badge px-2.5 py-0.5 rounded text-[11px] font-bold">
              COF25
            </span>
          </div>

          {/* Arena Conquered Pill & Title */}
          <div className="flex flex-col gap-1.5">
            <div className="victory-export-pill inline-flex items-center gap-2 text-sm font-bold tracking-wider">
              <span>🏆</span>
              <span>ARENA CONQUERED</span>
            </div>
            <h3 className="victory-export-team-name text-2xl sm:text-3xl font-black tracking-tight uppercase">
              {safeTeamName}
            </h3>
            <p className="victory-export-meta text-xs font-sans tracking-wide">
              {memberNames.length > 0 ? memberNames.join('  ·  ') : 'Team Participants'}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="victory-export-stats grid grid-cols-2 gap-3 rounded-xl p-4 text-center">
            <div className="victory-export-stat flex flex-col gap-1">
              <span className="victory-export-label text-[10px] font-bold tracking-wider uppercase">FINAL SCORE</span>
              <span className="victory-export-score text-xl sm:text-2xl font-black">{finalScore} PTS</span>
            </div>
            <div className="victory-export-stat flex flex-col gap-1">
              <span className="victory-export-label text-[10px] font-bold tracking-wider uppercase">ROUNDS</span>
              <span className="victory-export-total text-xl sm:text-2xl font-black">{roundsDone}</span>
            </div>
          </div>

          {/* Round Progress Lines */}
          <div className="flex flex-col gap-3 py-1">
            {roundSummaries.map((round) => {
              const pct = round.maxScore > 0 ? Math.min(100, Math.round((round.score / round.maxScore) * 100)) : 100;
              return (
                <div key={round.id} className="victory-export-round flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="victory-export-round-name font-medium">{round.name}</span>
                    <span className="victory-export-round-score flex items-center gap-1.5 font-bold">
                      <span>✓</span>
                      <span>{round.score} pts</span>
                    </span>
                  </div>
                  {/* Progress Bar Track */}
                  <div className="victory-export-progress-track w-full h-1.5 rounded-full overflow-hidden">
                    <div
                      className="victory-export-progress-bar h-full rounded-full"
                      style={{ width: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Footer Branding */}
          <div className="victory-export-footer border-t pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
            <span>VIT Chennai · CodeChef Student Chapter</span>
            <span className="victory-export-footer-accent font-bold">EVENT ID: COF25</span>
          </div>
        </div>
      </div>
    </div>
  );
}
