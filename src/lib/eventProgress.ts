import type { EventState } from '@/types/event';
import type { EventStep } from '@/components/event/EventProgress';

const STEP_DEFINITIONS: Omit<EventStep, 'state'>[] = [
  { id: 'round-1', name: 'Round 1: Maze of Fate', description: 'Topic Selection' },
  { id: 'round-2', name: 'Round 2: Blind Relay', description: 'Member Rotation' },
  { id: 'round-3', name: 'Round 3: Constraint Crucible', description: 'Modifiers' },
  { id: 'results', name: 'Leaderboard & Results', description: 'Final Standings' },
];

// currentRound 0 means "pre-Round-1 / not started yet", which should still show
// Round 1 as the active step; 1-3 map directly onto the round steps below by
// shifting down one index, unless the event has wrapped up, in which case
// results becomes active.
export function buildEventProgressSteps(
  state: Pick<EventState, 'currentRound' | 'eventStatus'>
): EventStep[] {
  const currentIndex =
    state.eventStatus === 'COMPLETED'
      ? STEP_DEFINITIONS.length - 1
      : Math.max(0, state.currentRound - 1);

  return STEP_DEFINITIONS.map((step, index) => {
    let stepState: EventStep['state'];
    if (index < currentIndex) stepState = 'completed';
    else if (index === currentIndex) stepState = 'active';
    else if (index === currentIndex + 1) stepState = 'upcoming';
    else stepState = 'locked';
    return { ...step, state: stepState };
  });
}
