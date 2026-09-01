import type { TeamMember, TeamStatus, Round2Phase } from '@/constants/event';

export type EventLifecycleStatus =
  | 'UPCOMING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED';

export interface CurrentProblemRef {
  problemId: string;
  title: string;
  status: 'UNSOLVED' | 'SOLVED' | 'LOCKED';
}

export interface EventState {
  eventStatus: EventLifecycleStatus;
  currentRound: 0 | 1 | 2 | 3;
  currentPhase: Round2Phase | null;
  roundStartedAt: string | null;
  roundEndsAt: string | null;
  teamStatus: TeamStatus;
  teamScore: number;
  activeMember: TeamMember | null;
  currentProblem: CurrentProblemRef | null;
}
