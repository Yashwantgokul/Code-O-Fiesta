'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiCall } from '@/lib/api';

const POLL_INTERVAL_MS = 15000;

export interface TeamRoundResult {
  roundNumber: number;
  status: string;
  score: number;
  achievements: {
    baseSolve: boolean;
    ouroboros: boolean;
    shortAndSweet: boolean;
    oneShotWonder: boolean;
  } | null;
  completedAt: string | null;
}

export interface TeamResults {
  teamName: string;
  totalScore: number;
  rank: number | null;
  rounds: TeamRoundResult[];
  status: string;
}

export interface UseTeamResultsResult {
  results: TeamResults | null;
  totalScore: number;
  getRoundScore: (roundNumber: number) => number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTeamResults(): UseTeamResultsResult {
  const [results, setResults] = useState<TeamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiCall('/api/results/me');
      setResults(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load team results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = setTimeout(refresh, 0);
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [refresh]);

  const getRoundScore = useCallback(
    (roundNumber: number) =>
      results?.rounds.find((round) => round.roundNumber === roundNumber)?.score ?? 0,
    [results],
  );

  return {
    results,
    totalScore: results?.totalScore ?? 0,
    getRoundScore,
    loading,
    error,
    refresh,
  };
}
