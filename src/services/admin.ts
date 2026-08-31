// Client-side local storage mock for organizer settings and team states.
// Team/submission data below is still a client-side local storage mock (not
// wired to the real backend) — round control (start/pause/resume/complete/
// override) now calls the real /api/admin/rounds/* endpoints so it actually
// affects what participants see.
import { apiCall } from '@/lib/api';

const DEFAULT_ROUNDS = [
  {
    roundNumber: 1,
    name: 'Maze of Fate',
    status: 'COMPLETED',
    durationSeconds: 3600,
    configuration: { problemCount: 3 },
  },
  {
    roundNumber: 2,
    name: 'Blind Relay',
    status: 'ACTIVE',
    durationSeconds: 2700,
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 2700 * 1000).toISOString(),
    configuration: { problemCount: 2 },
  },
  {
    roundNumber: 3,
    name: 'Constraint Crucible',
    status: 'UPCOMING',
    durationSeconds: 3600,
    configuration: { problemCount: 2 },
  },
];

const DEFAULT_TEAMS = [
  {
    id: 'team_codewarriors',
    name: 'CODEWARRIORS',
    status: 'ACTIVE',
    members: [
      {
        id: 'cw_1',
        name: 'CODEWARRIORS Captain',
        email: 'cw1@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_1',
      },
      {
        id: 'cw_2',
        name: 'CODEWARRIORS Member',
        email: 'cw2@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_2',
      },
    ],
    totalScore: 520,
    roundProgress: [
      {
        roundNumber: 1,
        roundName: 'Maze of Fate',
        status: 'COMPLETED',
        score: 180,
      },
      {
        roundNumber: 2,
        roundName: 'Blind Relay',
        status: 'COMPLETED',
        score: 340,
      },
      {
        roundNumber: 3,
        roundName: 'Constraint Crucible',
        status: 'NOT_STARTED',
        score: 0,
      },
    ],
  },
  {
    id: 'team_byteforce',
    name: 'BYTEFORCE',
    status: 'ACTIVE',
    members: [
      {
        id: 'bf_1',
        name: 'BYTEFORCE Captain',
        email: 'bf1@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_1',
      },
      {
        id: 'bf_2',
        name: 'BYTEFORCE Member',
        email: 'bf2@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_2',
      },
    ],
    totalScore: 490,
    roundProgress: [
      {
        roundNumber: 1,
        roundName: 'Maze of Fate',
        status: 'COMPLETED',
        score: 170,
      },
      {
        roundNumber: 2,
        roundName: 'Blind Relay',
        status: 'COMPLETED',
        score: 320,
      },
      {
        roundNumber: 3,
        roundName: 'Constraint Crucible',
        status: 'NOT_STARTED',
        score: 0,
      },
    ],
  },
  {
    id: 'team_debuggers',
    name: 'DEBUGGERS',
    status: 'ACTIVE',
    members: [
      {
        id: 'db_1',
        name: 'DEBUGGERS Captain',
        email: 'db1@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_1',
      },
      {
        id: 'db_2',
        name: 'DEBUGGERS Member',
        email: 'db2@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_2',
      },
    ],
    totalScore: 470,
    roundProgress: [
      {
        roundNumber: 1,
        roundName: 'Maze of Fate',
        status: 'COMPLETED',
        score: 160,
      },
      {
        roundNumber: 2,
        roundName: 'Blind Relay',
        status: 'COMPLETED',
        score: 310,
      },
      {
        roundNumber: 3,
        roundName: 'Constraint Crucible',
        status: 'NOT_STARTED',
        score: 0,
      },
    ],
  },
  {
    id: 'team_team_014',
    name: 'TEAM_014',
    status: 'ACTIVE',
    members: [
      {
        id: 't14_1',
        name: 'TEAM_014 Captain',
        email: 't141@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_1',
      },
      {
        id: 't14_2',
        name: 'TEAM_014 Member',
        email: 't142@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_2',
      },
    ],
    totalScore: 120,
    roundProgress: [
      {
        roundNumber: 1,
        roundName: 'Maze of Fate',
        status: 'COMPLETED',
        score: 120,
      },
      {
        roundNumber: 2,
        roundName: 'Blind Relay',
        status: 'IN_PROGRESS',
        score: 0,
      },
      {
        roundNumber: 3,
        roundName: 'Constraint Crucible',
        status: 'NOT_STARTED',
        score: 0,
      },
    ],
  },
  {
    id: 'team_algorithmic_alchemists',
    name: 'ALGORITHMIC_ALCHEMISTS',
    status: 'DISQUALIFIED',
    members: [
      {
        id: 'aa_1',
        name: 'ALCHEMISTS Captain',
        email: 'aa1@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_1',
      },
      {
        id: 'aa_2',
        name: 'ALCHEMISTS Member',
        email: 'aa2@gmail.com',
        role: 'PARTICIPANT',
        teamMember: 'MEMBER_2',
      },
    ],
    totalScore: 80,
    roundProgress: [
      {
        roundNumber: 1,
        roundName: 'Maze of Fate',
        status: 'COMPLETED',
        score: 80,
      },
      {
        roundNumber: 2,
        roundName: 'Blind Relay',
        status: 'DISQUALIFIED',
        score: 0,
      },
      {
        roundNumber: 3,
        roundName: 'Constraint Crucible',
        status: 'NOT_STARTED',
        score: 0,
      },
    ],
  },
];

const DEFAULT_SUBMISSIONS = [
  {
    id: 'sub_1',
    teamName: 'CODEWARRIORS',
    userName: 'CODEWARRIORS Captain',
    problemTitle: 'Digit Sum Magic',
    problemDifficulty: 'EASY',
    roundNumber: 1,
    roundName: 'Maze of Fate',
    verdict: 'ACCEPTED',
    language: 'cpp',
    submittedAt: new Date(Date.now() - 3600 * 2000).toISOString(),
  },
  {
    id: 'sub_2',
    teamName: 'BYTEFORCE',
    userName: 'BYTEFORCE Captain',
    problemTitle: 'Digit Sum Magic',
    problemDifficulty: 'EASY',
    roundNumber: 1,
    roundName: 'Maze of Fate',
    verdict: 'ACCEPTED',
    language: 'cpp',
    submittedAt: new Date(Date.now() - 3600 * 1800).toISOString(),
  },
  {
    id: 'sub_3',
    teamName: 'TEAM_014',
    userName: 'TEAM_014 Captain',
    problemTitle: 'Vowel Reversal',
    problemDifficulty: 'EASY',
    roundNumber: 1,
    roundName: 'Maze of Fate',
    verdict: 'ACCEPTED',
    language: 'cpp',
    submittedAt: new Date(Date.now() - 3600 * 1500).toISOString(),
  },
  {
    id: 'sub_4',
    teamName: 'BYTEFORCE',
    userName: 'BYTEFORCE Member',
    problemTitle: 'Subarray Sum K',
    problemDifficulty: 'MEDIUM',
    roundNumber: 2,
    roundName: 'Blind Relay',
    verdict: 'WRONG_ANSWER',
    language: 'cpp',
    submittedAt: new Date(Date.now() - 600 * 1000).toISOString(),
  },
  {
    id: 'sub_5',
    teamName: 'CODEWARRIORS',
    userName: 'CODEWARRIORS Member',
    problemTitle: 'Subarray Sum K',
    problemDifficulty: 'MEDIUM',
    roundNumber: 2,
    roundName: 'Blind Relay',
    verdict: 'ACCEPTED',
    language: 'cpp',
    submittedAt: new Date(Date.now() - 400 * 1000).toISOString(),
  },
];

// Helper to load/save state in localStorage
function getLocalState() {
  if (typeof window === 'undefined') {
    return {
      status: 'started',
      currentRound: 2,
      rounds: DEFAULT_ROUNDS,
      teams: DEFAULT_TEAMS,
      submissions: DEFAULT_SUBMISSIONS,
    };
  }

  const stateStr = window.localStorage.getItem('cof_admin_state');

  if (!stateStr) {
    const initialState = {
      status: 'started',
      currentRound: 2,
      rounds: DEFAULT_ROUNDS,
      teams: DEFAULT_TEAMS,
      submissions: DEFAULT_SUBMISSIONS,
    };

    window.localStorage.setItem(
      'cof_admin_state',
      JSON.stringify(initialState),
    );

    return initialState;
  }

  try {
    return JSON.parse(stateStr);
  } catch {
    return {
      status: 'started',
      currentRound: 2,
      rounds: DEFAULT_ROUNDS,
      teams: DEFAULT_TEAMS,
      submissions: DEFAULT_SUBMISSIONS,
    };
  }
}

function saveLocalState(state: any) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'cof_admin_state',
      JSON.stringify(state),
    );
  }
}

export const adminService = {
  getRound2Config: async (): Promise<{
    totalDurationSeconds: number;
    member1DurationSeconds: number;
    handoverDurationSeconds: number;
    member2DurationSeconds: number;
  }> => apiCall('/api/admin/rounds/2/config'),

  updateRound2Config: async (config: {
    totalDurationSeconds: number;
    member1DurationSeconds: number;
    handoverDurationSeconds: number;
    member2DurationSeconds: number;
  }) =>
    apiCall('/api/admin/rounds/2/config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    }),

  getAdminState: async () => {
    const rounds = await apiCall('/api/admin/rounds');

    const activeOrPaused = rounds.find(
      (r: any) =>
        r.status === 'ACTIVE' ||
        r.status === 'PAUSED',
    );

    const allCompleted =
      rounds.length > 0 &&
      rounds.every(
        (r: any) => r.status === 'COMPLETED',
      );

    const upcoming = rounds.find(
      (r: any) => r.status === 'UPCOMING',
    );

    const status: 'waiting' | 'started' | 'ended' =
      allCompleted
        ? 'ended'
        : activeOrPaused
          ? 'started'
          : 'waiting';

    return {
      status,
      currentRound:
        activeOrPaused?.roundNumber ??
        upcoming?.roundNumber ??
        rounds[rounds.length - 1]?.roundNumber ??
        1,
      rounds,
    };
  },

  getTeams: async () => {
    const state = getLocalState();
    return state.teams;
  },

  getSubmissions: async () => {
    const state = getLocalState();
    return state.submissions;
  },

  startRound: async (
    roundNumber: number,
  ): Promise<any> => {
    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/start`,
        {
          method: 'POST',
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to start round',
      };
    }
  },

  pauseRound: async (
    roundNumber: number,
  ): Promise<any> => {
    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/pause`,
        {
          method: 'POST',
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to pause round',
      };
    }
  },

  resumeRound: async (
    roundNumber: number,
  ): Promise<any> => {
    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/resume`,
        {
          method: 'POST',
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to resume round',
      };
    }
  },

  completeRound: async (
    roundNumber: number,
  ): Promise<any> => {

    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/complete`,
        {
          method: 'POST',
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to complete round',
      };
    }
  },

  restartRound: async (
    roundNumber: number,
  ): Promise<any> => {
    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/restart`,
        {
          method: 'POST',
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to restart round',
      };
    }
  },

  overrideRoundDuration: async (
    roundNumber: number,
    durationSeconds: number,
  ): Promise<any> => {
    try {
      const round = await apiCall(
        `/api/admin/rounds/${roundNumber}/override`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            durationSeconds,
          }),
        },
      );

      return {
        success: true,
        round,
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to override round duration',
      };
    }
  },

  overrideTeamScore: async (
    teamId: string,
    roundNumber: number,
    totalScore: number,
  ): Promise<any> => {
    const state = getLocalState();

    state.teams = state.teams.map(
      (team: any) => {
        if (team.id === teamId) {
          const roundProgress =
            team.roundProgress.map(
              (rp: any) => {
                if (
                  rp.roundNumber ===
                  roundNumber
                ) {
                  return {
                    ...rp,
                    score: totalScore,
                    status: 'COMPLETED',
                  };
                }

                return rp;
              },
            );

          // Recalculate total score
          const newTotal =
            roundProgress.reduce(
              (
                sum: number,
                rp: any,
              ) =>
                sum +
                (rp.score || 0),
              0,
            );

          return {
            ...team,
            roundProgress,
            totalScore: newTotal,
          };
        }

        return team;
      },
    );

    saveLocalState(state);

    return {
      success: true,
    };
  },

  updateTeamStatus: async (
    teamId: string,
    status: string,
  ): Promise<any> => {
    const state = getLocalState();

    state.teams = state.teams.map(
      (team: any) => {
        if (team.id === teamId) {
          return {
            ...team,
            status,
          };
        }

        return team;
      },
    );

    saveLocalState(state);

    return {
      success: true,
    };
  },
};