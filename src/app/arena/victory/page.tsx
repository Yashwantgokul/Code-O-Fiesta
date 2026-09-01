'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '@/app/guards/AuthGuard';
import ParticipantLayout from '@/components/layout/ParticipantLayout';
import LoadingState from '@/components/common/LoadingState';
import VictoryHero from '@/components/victory/VictoryHero';
import VictoryScoreStrip from '@/components/victory/VictoryScoreStrip';
import VictoryTeamCard, { RoundSummary } from '@/components/victory/VictoryTeamCard';
import VictoryExitModal from '@/components/victory/VictoryExitModal';
import useAuth from '@/hooks/useAuth';
import { useTeamResults } from '@/hooks/useTeamResults';
import { apiCall } from '@/lib/api';

const ROUND_NUMBERS = [1, 2, 3] as const;

const ROUND_NAMES: Record<number, string> = {
  1: 'Round 1: Path of Fate',
  2: 'Round 2: Blind Relay',
  3: 'Round 3: Constraint Crucible',
};

// Max attainable score per round — 3 problems x 50pts for Rounds 1-2, and
// Round 3's base + bonus formula (50 + 30 + 20 + 40) x 3 problems, matching
// the same constants already shown on the Round 3 dashboard.
const ROUND_MAX_SCORES: Record<number, number> = { 1: 150, 2: 150, 3: 420 };

function VictoryPageContent() {
  const { user } = useAuth();
  const { results, totalScore, loading: resultsLoading } = useTeamResults();

  const [teamName, setTeamName] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [loadingTeamInfo, setLoadingTeamInfo] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  // Team name/members come from /api/team/me (own team only).
  useEffect(() => {
    let active = true;

    async function loadTeamInfo() {
      try {
        const teamRes = await apiCall('/api/team/me').catch(() => null);
        if (!active) return;

        if (teamRes?.team) {
          setTeamName(teamRes.team.name);
          setMemberNames((teamRes.team.members || []).map((m: any) => m.name).filter(Boolean));
        }
      } finally {
        if (active) setLoadingTeamInfo(false);
      }
    }

    loadTeamInfo();
    return () => {
      active = false;
    };
  }, []);

  const loading = resultsLoading || loadingTeamInfo;

  if (loading) {
    return (
      <ParticipantLayout>
        <LoadingState message="Compiling arena victory certificate..." mode="full-page" />
      </ParticipantLayout>
    );
  }

  // Always show all three rounds, even ones the team hasn't started yet
  // (no TeamRound document for that round means no entry in results.rounds) —
  // the certificate should give a complete picture, not just whatever
  // happens to exist in the DB.
  const roundsByNumber = new Map((results?.rounds ?? []).map((r) => [r.roundNumber, r]));
  const roundsCompletedCount = ROUND_NUMBERS.filter((num) => roundsByNumber.get(num)?.status === 'COMPLETED').length;
  const roundsDone = `${roundsCompletedCount} / ${ROUND_NUMBERS.length}`;

  const roundSummaries: RoundSummary[] = ROUND_NUMBERS.map((num) => {
    const r = roundsByNumber.get(num);
    return {
      id: String(num),
      name: ROUND_NAMES[num],
      score: r?.score ?? 0,
      maxScore: ROUND_MAX_SCORES[num],
      completed: r?.status === 'COMPLETED',
    };
  });

  const displayTeamName = teamName || results?.teamName || user?.name || 'CHAMPIONS';

  return (
    <ParticipantLayout>
      <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
        {/* 1. Hero Section */}
        <VictoryHero teamName={displayTeamName} />

        {/* 2. Score Summary Strip */}
        <VictoryScoreStrip
          finalScore={totalScore}
          roundsDone={roundsDone}
          timeTaken="—"
        />

        {/* 3. Photo / Certificate Section */}
        <VictoryTeamCard
          teamId={displayTeamName}
          memberNames={memberNames}
          finalScore={totalScore}
          roundsDone={roundsDone}
          roundSummaries={roundSummaries}
        />

        {/* 4. Footer CTA */}
        <div className="mt-8 border-t border-[#1e224d] pt-8 flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-1.5 font-mono">
            <p className="text-xs sm:text-sm text-slate-300 font-semibold">
              Thank you for competing in Code-O-Fiesta 2025.
            </p>
            <p className="text-[11px] text-slate-500">
              © 2025 Code-O-Fiesta · VIT Chennai – CodeChef Student Chapter
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-rose-500/40 hover:border-rose-500/80 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-rose-950/30 transition-all cursor-pointer group"
          >
            <span>Exit Arena</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Exit confirmation modal */}
        <VictoryExitModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
        />
      </div>
    </ParticipantLayout>
  );
}

export default function VictoryPage() {
  return (
    <AuthGuard requiredRole="PARTICIPANT">
      <VictoryPageContent />
    </AuthGuard>
  );
}
