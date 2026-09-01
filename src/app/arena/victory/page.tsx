'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '@/app/guards/AuthGuard';
import ParticipantLayout from '@/components/layout/ParticipantLayout';
import LoadingState from '@/components/common/LoadingState';
import VictoryHero from '@/components/victory/VictoryHero';
import VictoryScoreStrip from '@/components/victory/VictoryScoreStrip';
import VictoryTeamCard, { RoundSummary } from '@/components/victory/VictoryTeamCard';
import VictoryRoundBreakdown, { DetailedRound } from '@/components/victory/VictoryRoundBreakdown';
import VictoryExitModal from '@/components/victory/VictoryExitModal';
import useAuth from '@/hooks/useAuth';
import { useTeamResults } from '@/hooks/useTeamResults';
import { apiCall } from '@/lib/api';

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
  const [rank, setRank] = useState<number | string>('—');
  const [loadingTeamInfo, setLoadingTeamInfo] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeamInfo() {
      try {
        const [teamRes, leaderboardRes] = await Promise.all([
          apiCall('/api/team/me').catch(() => null),
          apiCall('/api/leaderboard').catch(() => []),
        ]);

        if (!active) return;

        if (teamRes?.team) {
          setTeamName(teamRes.team.name);
          setMemberNames((teamRes.team.members || []).map((m: any) => m.name).filter(Boolean));
        }

        if (Array.isArray(leaderboardRes) && user?.teamId) {
          const entry = leaderboardRes.find((t: any) => t.teamId === user.teamId);
          if (entry?.rank) setRank(entry.rank);
        }
      } finally {
        if (active) setLoadingTeamInfo(false);
      }
    }

    loadTeamInfo();
    return () => {
      active = false;
    };
  }, [user?.teamId]);

  const loading = resultsLoading || loadingTeamInfo;

  if (loading) {
    return (
      <ParticipantLayout>
        <LoadingState message="Compiling arena victory certificate..." mode="full-page" />
      </ParticipantLayout>
    );
  }

  const rounds = results?.rounds ?? [];
  const roundsCompletedCount = rounds.filter((r) => r.status === 'COMPLETED').length;
  const roundsDone = `${roundsCompletedCount} / ${rounds.length || 3}`;

  const roundSummaries: RoundSummary[] = rounds.map((r) => ({
    id: String(r.roundNumber),
    name: ROUND_NAMES[r.roundNumber] || `Round ${r.roundNumber}`,
    score: r.score,
    maxScore: ROUND_MAX_SCORES[r.roundNumber] || Math.max(r.score, 1),
    completed: r.status === 'COMPLETED',
  }));

  const detailedRounds: DetailedRound[] = roundSummaries.map((r) => ({
    id: `round-${r.id}`,
    name: r.name.toUpperCase(),
    score: r.score,
    maxScore: r.maxScore,
    completed: r.completed,
    // Per-problem detail isn't tracked by the results API — the accordion
    // shows a graceful "not available" message instead of fabricated rows.
    problems: [],
  }));

  const displayTeamName = teamName || results?.teamName || user?.name || 'CHAMPIONS';

  return (
    <ParticipantLayout>
      <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
        {/* 1. Hero Section */}
        <VictoryHero teamName={displayTeamName} />

        {/* 2. Score Summary Strip */}
        <VictoryScoreStrip
          finalScore={totalScore}
          teamRank={rank}
          roundsDone={roundsDone}
          timeTaken="—"
        />

        {/* 3. Photo / Certificate Section */}
        <VictoryTeamCard
          teamId={displayTeamName}
          memberNames={memberNames}
          finalScore={totalScore}
          teamRank={rank}
          roundsDone={roundsDone}
          roundSummaries={roundSummaries.length > 0 ? roundSummaries : undefined}
        />

        {/* 4. Round Breakdown Accordion */}
        <VictoryRoundBreakdown rounds={detailedRounds.length > 0 ? detailedRounds : undefined} />

        {/* 5. Footer CTA */}
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
