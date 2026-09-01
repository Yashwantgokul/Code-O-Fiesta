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
      if (data?.eventStatus) return data as EventState;
      throw new Error('Empty event state response');
    } catch {
      // Backend event state isn't wired up yet — fall back to a neutral upcoming state.
      return buildFallbackEventState();
    }
  },
};
