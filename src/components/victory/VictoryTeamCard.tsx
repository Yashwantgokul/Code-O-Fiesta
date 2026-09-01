'use client';

import React, { useState } from 'react';

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
  teamRank: number | string;
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
  teamRank,
  roundsDone = '3 / 3',
  roundSummaries = DEFAULT_ROUND_SUMMARIES,
}: VictoryTeamCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayRank = typeof teamRank === 'number' && teamRank > 0 ? `#${teamRank}` : String(teamRank || '#4');
  const safeTeamName = teamId || 'TEAM_014';
  const cleanTeamFile = safeTeamName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handleDownload = async () => {
    const cardEl = document.getElementById('team-victory-card');
    if (!cardEl) return;

    try {
      setIsDownloading(true);
      const html2canvasModule = await import('html2canvas');
      const html2canvasFn = (html2canvasModule.default || html2canvasModule) as any;
      const canvas = await html2canvasFn(cardEl, {
        backgroundColor: '#0a0a12',
        scale: 2, // High resolution retina capture
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cof25_${cleanTeamFile}_victory.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
      setToastMessage('Could not generate the image. Please try again.');
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `We conquered Code-O-Fiesta COF25! 🏆 Team ${safeTeamName} · ${finalScore} pts · ${displayRank} rank · VIT Chennai`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setToastMessage('Copied share text to clipboard!');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="bg-[#111120] border border-purple-500/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e224d] pb-4">
        <div>
          <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>YOUR TEAM CERTIFICATE</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Official proof of completion and arena victory
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-purple-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <span>📷</span>
              <span>Download PNG</span>
            </>
          )}
        </button>
      </div>

      {/* Target download card */}
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
          <div className="victory-export-stats grid grid-cols-3 gap-3 rounded-xl p-4 text-center">
            <div className="victory-export-stat flex flex-col gap-1">
              <span className="victory-export-label text-[10px] font-bold tracking-wider uppercase">FINAL SCORE</span>
              <span className="victory-export-score text-xl sm:text-2xl font-black">{finalScore} PTS</span>
            </div>
            <div className="victory-export-stat victory-export-stat-divider flex flex-col gap-1">
              <span className="victory-export-label text-[10px] font-bold tracking-wider uppercase">RANK</span>
              <span className="victory-export-rank text-xl sm:text-2xl font-black">{displayRank}</span>
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

      {/* Action Buttons Below Card */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 border border-purple-400/40"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generating PNG...</span>
            </>
          ) : (
            <>
              <span>📷</span>
              <span>Download as PNG</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#131535] hover:bg-[#1a1e4d] border border-purple-500/30 hover:border-purple-500/60 text-slate-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#11122c] border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
