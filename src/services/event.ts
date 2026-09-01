import { apiCall } from '@/lib/api';
import type { EventState } from '@/types/event';

function buildFallbackEventState(): EventState {
  return {
    eventStatus: 'UPCOMING',
    currentRound: 0,
    currentPhase: null,
    roundStartedAt: null,
    roundEndsAt: null,
    teamStatus: 'ACTIVE',
    teamScore: 0,
    activeMember: null,
    currentProblem: null,
  };
}

export const eventService = {
  async getEventState(): Promise<EventState> {
    try {
      const data = await apiCall('/api/event/state');
      if (!data?.eventStatus) throw new Error('Empty event state response');

      // /api/event/state returns the active Round document (or null) under
      // currentRound — normalize that into the plain 0-3 number the rest of
      // the app expects for "which round is the team currently on".
      const activeRound = data.currentRound as { roundNumber?: number; startedAt?: string | null; endsAt?: string | null } | null;

      return {
        eventStatus: data.eventStatus,
        currentRound: (activeRound?.roundNumber ?? 0) as EventState['currentRound'],
        currentPhase: null,
        roundStartedAt: activeRound?.startedAt ?? null,
        roundEndsAt: activeRound?.endsAt ?? null,
        teamStatus: 'ACTIVE',
        teamScore: 0,
        activeMember: null,
        currentProblem: null,
      };
    } catch {
      // Backend event state isn't wired up yet — fall back to a neutral upcoming state.
      return buildFallbackEventState();
    }
  },
};
