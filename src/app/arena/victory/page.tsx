'use client';

import React, { useEffect, useState } from 'react';
import AuthGuard from '@/app/guards/AuthGuard';
import ParticipantLayout from '@/components/layout/ParticipantLayout';
import LoadingState from '@/components/common/LoadingState';
import VictoryHero from '@/components/victory/VictoryHero';
import VictoryScoreStrip from '@/components/victory/VictoryScoreStrip';
import VictoryTeamCard from '@/components/victory/VictoryTeamCard';
import VictoryRoundBreakdown from '@/components/victory/VictoryRoundBreakdown';
import VictoryExitModal from '@/components/victory/VictoryExitModal';
import { authService } from '@/services/auth';
import { leaderboardService } from '@/services/leaderboard';

export interface VictoryPageData {
  teamId: string;
  teamName: string;
  memberNames: string[];
  finalScore: number;
  teamRank: number | string;
  roundsDone: string;
  timeTaken: string;
}

const DEFAULT_VICTORY_DATA: VictoryPageData = {
  teamId: 'TEAM_014',
  teamName: 'TEAM_014',
  memberNames: ['Member 01', 'Member 02'],
  finalScore: 120,
  teamRank: 4,
  roundsDone: '3 / 3',
  timeTaken: '1h 17m',
};

function VictoryPageContent() {
  const [data, setData] = useState<VictoryPageData>(DEFAULT_VICTORY_DATA);
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    const fetchVictoryStats = async () => {
      try {
        setLoading(true);
        // Fetch current auth & team data
        const authRes = await authService.getMe();
        let teamId = 'TEAM_014';
        let teamName = 'TEAM_014';
        let members: string[] = ['Member 01', 'Member 02'];

        if (authRes.authenticated && authRes.team) {
          teamId = authRes.team.id || authRes.team.name || 'TEAM_014';
          teamName = authRes.team.name || authRes.team.id || 'TEAM_014';
          if (authRes.team.members && authRes.team.members.length > 0) {
            members = (authRes.team.members as any[]).map((m: any) =>
              typeof m === 'string' ? m : m.name || m.email || 'Member'
            );
          }
        }

        // Fetch score & ranking
        let score = 120;
        let rank: number | string = 4;
        try {
          const resultsRes = await leaderboardService.getResults();
          if (resultsRes && resultsRes.results) {
            score = resultsRes.results.grandTotalScore || score;
            rank = resultsRes.results.rank || rank;
          }
        } catch (e) {
          // Graceful fallback to default demo telemetry
        }

        setData({
          teamId,
          teamName,
          memberNames: members,
          finalScore: score,
          teamRank: rank,
          roundsDone: '3 / 3',
          timeTaken: '1h 17m',
        });
      } catch (err) {
        console.warn('Using default victory telemetry data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVictoryStats();
  }, []);

  if (loading) {
    return (
      <ParticipantLayout>
        <LoadingState message="Compiling arena victory certificate..." mode="full-page" />
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout>
      <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
        {/* 1. Hero Section */}
        <VictoryHero teamName={data.teamName} />

        {/* 2. Score Summary Strip */}
        <VictoryScoreStrip
          finalScore={data.finalScore}
          teamRank={data.teamRank}
          roundsDone={data.roundsDone}
          timeTaken={data.timeTaken}
        />

        {/* 3. Photo / Certificate Section */}
        <VictoryTeamCard
          teamId={data.teamName}
          memberNames={data.memberNames}
          finalScore={data.finalScore}
          teamRank={data.teamRank}
          roundsDone={data.roundsDone}
        />

        {/* 4. Round Breakdown Accordion */}
        <VictoryRoundBreakdown />

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
