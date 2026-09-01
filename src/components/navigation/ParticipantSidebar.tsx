'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAllRoundsStatus } from '@/hooks/useRoundStatus';
import { RoundStatus } from '@/constants/event';
import VictoryExitModal from '@/components/victory/VictoryExitModal';

export interface ParticipantSidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

const ROUND_BADGE_STYLES: Record<string, string> = {
  [RoundStatus.ACTIVE]: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  [RoundStatus.PAUSED]: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  [RoundStatus.COMPLETED]: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
  [RoundStatus.UPCOMING]: 'bg-slate-800 text-slate-500 border border-transparent',
};

const ROUND_BADGE_LABELS: Record<string, string> = {
  [RoundStatus.ACTIVE]: 'ACTIVE',
  [RoundStatus.PAUSED]: 'PAUSED',
  [RoundStatus.COMPLETED]: 'COMPLETED',
  [RoundStatus.UPCOMING]: 'LOCKED',
};

export default function ParticipantSidebar({ className = '', onCloseMobile }: ParticipantSidebarProps) {
  const pathname = usePathname();
  const [showExitModal, setShowExitModal] = useState(false);
  const { rounds } = useAllRoundsStatus();
  const statusByRoundNumber = new Map(rounds.map((r) => [r.roundNumber, r.status]));

  const navItems = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'round-1',
      label: 'ROUND 1',
      sublabel: 'Path of Fate',
      href: '/round-1/path',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1m2 1l2-1m-2 1v-2.5M18 18l-2-1m2 1l2-1m-2 1v-2.5" />
        </svg>
      ),
    },
    {
      id: 'round-2',
      label: 'ROUND 2',
      sublabel: 'Blind Relay',
      href: '/round-2',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: 'round-3',
      label: 'ROUND 3',
      sublabel: 'Constraint Crucible',
      href: '/round-3',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },

    {
      id: 'victory',
      label: 'VICTORY',
      href: '/arena/victory',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`w-64 bg-[#090a1a] border-r border-[#191c40] flex flex-col justify-between h-full select-none ${className}`}
    >
      {/* Top Section: Logo Branding */}
      <div>
        <div className="h-16 px-6 border-b border-[#191c40] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-purple-400 font-mono font-bold text-lg">&lt;/&gt;</span>
            <span className="font-mono font-extrabold text-sm tracking-wider text-white">
              CODE<span className="text-purple-400">-</span>O<span className="text-purple-400">-</span>FIESTA<span className="animate-pulse text-purple-400">_</span>
            </span>
          </Link>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-slate-400 hover:text-white p-1">
              ✕
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="p-3 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30'
                    : 'text-slate-400 hover:bg-[#121433] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'}`}>
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="tracking-wide">{item.label}</span>
                    {item.sublabel && (
                      <span className={`text-[10px] ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {item.id.startsWith('round-') && (() => {
                  const roundNumber = Number(item.id.replace('round-', ''));
                  const status = statusByRoundNumber.get(roundNumber) ?? RoundStatus.UPCOMING;
                  return (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${ROUND_BADGE_STYLES[status]}`}
                    >
                      {ROUND_BADGE_LABELS[status]}
                    </span>
                  );
                })()}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Connection Telemetry & Exit Arena Action */}
      <div className="p-4 border-t border-[#191c40] bg-[#070815] flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              SYSTEM STATUS
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            All systems operational
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold text-rose-400/90 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>CLOSE ARENA</span>
        </button>
      </div>

      <VictoryExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
      />
    </aside>
  );
}
