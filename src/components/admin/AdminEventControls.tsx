import React, { useState } from 'react';

interface RoundInfo {
  roundNumber: number;
  name: string;
  status: string;
  durationSeconds: number;
}

interface AdminEventControlsProps {
  rounds: RoundInfo[];
  onStartRound: (roundNumber: number) => void;
  onPauseRound: (roundNumber: number) => void;
  onResumeRound: (roundNumber: number) => void;
  onCompleteRound: (roundNumber: number) => void;
  onRestartRound: (roundNumber: number) => void;
}

export default function AdminEventControls({
  rounds,
  onStartRound,
  onPauseRound,
  onResumeRound,
  onCompleteRound,
  onRestartRound,
}: AdminEventControlsProps) {
  const [confirmRestart, setConfirmRestart] = useState<number | null>(null);

  const handleRestartClick = (roundNumber: number) => {
    setConfirmRestart(roundNumber);
  };

  const handleConfirm = () => {
    if (confirmRestart !== null) {
      onRestartRound(confirmRestart);
      setConfirmRestart(null);
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {confirmRestart !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d0e24] border border-rose-500/40 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-mono font-extrabold text-white uppercase tracking-wider">
                Confirm Restart
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed mb-5">
              This will <span className="text-rose-400 font-bold">delete all team progress</span> for Round {confirmRestart} and restart it from scratch. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestart(null)}
                className="flex-1 py-2 bg-[var(--surface-interactive)] border border-[var(--border)] text-slate-300 rounded text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[var(--surface-secondary)] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider transition-colors"
              >
                RESTART ↺
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm mb-6">
        <h3 className="text-xs font-mono font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          STAGE CONTROL PANEL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rounds.map((round) => {
            const isUpcoming = round.status === 'UPCOMING';
            const isActive = round.status === 'ACTIVE';
            const isPaused = round.status === 'PAUSED';
            const isCompleted = round.status === 'COMPLETED';

            let statusColor = 'text-[var(--text-muted)]';
            let borderStyle = 'border-[var(--border-subtle)]';
            let statusLabel = 'LOCKED';

            if (isActive) {
              statusColor = 'text-cyan-400 font-extrabold animate-pulse';
              borderStyle = 'border-cyan-500/40 ring-1 ring-cyan-500/10';
              statusLabel = 'ACTIVE NOW';
            } else if (isPaused) {
              statusColor = 'text-amber-400 font-extrabold';
              borderStyle = 'border-amber-500/40 ring-1 ring-amber-500/10';
              statusLabel = 'PAUSED';
            } else if (isCompleted) {
              statusColor = 'text-[var(--success)] font-bold';
              borderStyle = 'border-[var(--success)]/30';
              statusLabel = 'COMPLETED';
            }

            return (
              <div
                key={round.roundNumber}
                className={`bg-[var(--surface-secondary)] border ${borderStyle} rounded-xl p-4 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-mono text-[var(--text-muted)] block uppercase">
                      STAGE 0{round.roundNumber}
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      {round.name}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-mono uppercase ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col gap-2">
                  {isUpcoming && (
                    <button
                      onClick={() => onStartRound(round.roundNumber)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      START ROUND →
                    </button>
                  )}

                  {isActive && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPauseRound(round.roundNumber)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        PAUSE ⏸
                      </button>
                      <button
                        onClick={() => onCompleteRound(round.roundNumber)}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        COMPLETE ✓
                      </button>
                    </div>
                  )}

                  {isPaused && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onResumeRound(round.roundNumber)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        RESUME ▶
                      </button>
                      <button
                        onClick={() => onCompleteRound(round.roundNumber)}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        COMPLETE ✓
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="w-full py-2 bg-[var(--surface-interactive)] border border-[var(--border-subtle)] rounded text-center text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">
                      STAGE FINISHED
                    </div>
                  )}

                  {/* Restart button — shown for ACTIVE, PAUSED, and COMPLETED */}
                  {(isActive || isPaused || isCompleted) && (
                    <button
                      onClick={() => handleRestartClick(round.roundNumber)}
                      className="w-full py-2 bg-rose-900/40 hover:bg-rose-700/50 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      RESTART ↺
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}


