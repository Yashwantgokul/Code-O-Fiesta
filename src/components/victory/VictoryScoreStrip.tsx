'use client';

import React from 'react';

interface VictoryScoreStripProps {
  finalScore: number;
  teamRank: number | string;
  roundsDone?: string;
  timeTaken?: string;
}

export default function VictoryScoreStrip({
  finalScore,
  teamRank,
  roundsDone = '3 / 3',
  timeTaken = '1h 17m',
}: VictoryScoreStripProps) {
  const cards = [
    {
      label: 'FINAL SCORE',
      value: `${finalScore} PTS`,
      valueColor: 'text-purple-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]',
      borderHover: 'hover:border-purple-500/50',
    },
    {
      label: 'TEAM RANK',
      value: typeof teamRank === 'number' && teamRank > 0 ? `#${teamRank}` : String(teamRank || '—'),
      valueColor: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]',
      borderHover: 'hover:border-cyan-500/50',
    },
    {
      label: 'ROUNDS DONE',
      value: roundsDone,
      valueColor: 'text-white',
      borderHover: 'hover:border-purple-500/40',
    },
    {
      label: 'TIME TAKEN',
      value: timeTaken,
      valueColor: 'text-white',
      borderHover: 'hover:border-purple-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-[#111120] border border-purple-600/25 rounded-xl p-5 flex flex-col justify-between gap-2 shadow-lg transition-all duration-300 ${card.borderHover}`}
        >
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-[0.1em]">
            {card.label}
          </span>
          <span className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${card.valueColor}`}>
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}
