import { NextResponse } from 'next/server';

import {
  Round2Phase,
  RoundStatus,
  TeamMember,
  TeamRoundStatus,
} from '@/constants/event';
import connectDB from '@/lib/db';
import Problem, { type ProblemDocument } from '@/models/Problem';
import Round from '@/models/Round';
import TeamRound from '@/models/TeamRound';
import { requireAuthentication } from '@/app/api/_lib/authorization';
import {
  RoundRequestError,
  type PatchRound2CodeInput,
  type PostRound2CompleteInput,
  type Round2Number,
} from '../_validators/round';

type Timing = {
  member1DurationSeconds: number;
  handoverDurationSeconds: number;
  member2DurationSeconds: number;
};

type Question = {
  questionNumber: number;
  problemId?: unknown;
  activeMember?: TeamMember | null;
  phase?: Round2Phase;
  member1StartedAt?: Date | null;
  member1EndsAt?: Date | null;
  handoverStartedAt?: Date | null;
  handoverEndsAt?: Date | null;
  member2StartedAt?: Date | null;
  member2EndsAt?: Date | null;
  status?: string;
  code?: string;
  hasSeenBothPhases?: boolean;
  member2Submitted?: boolean;
};

type Round2 = {
  currentQuestionNumber?: number;
  activeMember?: TeamMember | null;
  phase?: Round2Phase;
  phaseStartedAt?: Date | null;
  phaseEndsAt?: Date | null;
  configSnapshot?: Timing;
  questions?: Question[];
};

type TeamRoundInstance = {
  _id?: unknown;
  status?: TeamRoundStatus;
  startedAt?: Date | null;
  endsAt?: Date | null;
  completedAt?: Date | null;
  round2?: Round2;
  save: () => Promise<unknown>;
};

type RoundDoc = {
  _id: unknown;
  status?: RoundStatus;
  durationSeconds?: number;
  configuration?: {
    round2?: {
      questionCount?: number;
    } & Partial<Timing>;
  };
};

export type Round2Actor = {
  userId: string;
  teamId: string;
  teamMember: TeamMember;
};

export type Round2ScopedInput = {
  roundNumber: Round2Number;
  actor: Round2Actor;
  nowMs?: number;
};

export type Round2AllowedActions = {
  canSeeProblem: boolean;
  canEditCode: boolean;
  canSubmitCode: boolean;
  canSubmit: boolean;
  canCompleteQuestion: boolean;
  canStartNextQuestion: boolean;
};

export type Round2StateView = {
  roundNumber: Round2Number;
  roundStatus: TeamRoundStatus;
  globalStartTime: Date | null;
  globalEndsAt: Date | null;
  isGlobalExpired: boolean;
  phase: Round2Phase;
  activeMember: TeamMember | null;
  phaseStartedAt: Date | null;
  phaseEndsAt: Date | null;
  serverTime: Date;
  currentQuestionNumber: number;
  totalQuestions: number;
  currentCode: string | null;
  member2Submitted: boolean;
  allowedActions: Round2AllowedActions;
};

const defaults: Timing = {
  member1DurationSeconds: 600,
  handoverDurationSeconds: 120,
  member2DurationSeconds: 900,
};

async function resolveActor(request: Request): Promise<Round2Actor> {
  let session;

  try {
    session = await requireAuthentication(request);
  } catch {
    throw new RoundRequestError(
      'Authentication required.',
      401,
      'UNAUTHENTICATED',
    );
  }

  if (!session.teamId) {
    throw new RoundRequestError(
      'User is not assigned to a team.',
      403,
      'NO_TEAM',
    );
  }

  if (
    session.teamMember !== TeamMember.MEMBER_1 &&
    session.teamMember !== TeamMember.MEMBER_2
  ) {
    throw new RoundRequestError(
      'User team member role is not set.',
      403,
      'NO_TEAM_ROLE',
    );
  }

  return {
    userId: session.userId,
    teamId: session.teamId,
    teamMember: session.teamMember,
  };
}

function timing(
  round: RoundDoc,
  teamRound: TeamRoundInstance,
): Timing {
  // Mongoose auto-vivifies this inline-object schema path into an
  // always-truthy (but field-empty) object on every document hydration, so
  // checking `configSnapshot`'s truthiness never falls through to the
  // defaults below — it must be checked for an actual persisted value.
  const snapshot = teamRound.round2?.configSnapshot;
  if (snapshot && typeof snapshot.member1DurationSeconds === 'number') {
    return snapshot as Timing;
  }

  return (
    {
      member1DurationSeconds:
        round.configuration?.round2?.member1DurationSeconds ??
        defaults.member1DurationSeconds,

      handoverDurationSeconds:
        round.configuration?.round2?.handoverDurationSeconds ??
        defaults.handoverDurationSeconds,

      member2DurationSeconds:
        round.configuration?.round2?.member2DurationSeconds ??
        defaults.member2DurationSeconds,
    }
  );
}

function globalEnd(teamRound: TeamRoundInstance) {
  return (
    teamRound.endsAt ??
    (teamRound.startedAt
      ? new Date(teamRound.startedAt.getTime() + 3600000)
      : null)
  );
}

function phaseMember(
  phase: Round2Phase,
): TeamMember | null {
  return phase === Round2Phase.MEMBER_1
    ? TeamMember.MEMBER_1
    : phase === Round2Phase.MEMBER_2
      ? TeamMember.MEMBER_2
      : null;
}

async function getOrCreateTeamRound(
  actor: Round2Actor,
) {
  await connectDB();

  const raw = await Round.findOne({
    roundNumber: 2,
  }).lean();

  if (!raw) {
    throw new RoundRequestError(
      'Round 2 has not been configured by admin.',
      404,
      'ROUND_NOT_FOUND',
    );
  }

  const round = raw as unknown as RoundDoc;

  // Global source of truth: only the admin-activated round may serve or
  // accept round-scoped data, regardless of this team's own progress status.
  if (round.status !== RoundStatus.ACTIVE) {
    throw new RoundRequestError(
      'Round 2 is not currently active.',
      403,
      'ROUND_NOT_ACTIVE',
    );
  }

  let teamRound =
    (await TeamRound.findOne({
      teamId: actor.teamId as any,
      roundId: round._id as any,
    })) as unknown as TeamRoundInstance | null;

  if (!teamRound) {
    teamRound = new TeamRound({
      teamId: actor.teamId,
      roundId: round._id,
      status: TeamRoundStatus.NOT_STARTED,
      round2: {
        currentQuestionNumber: 1,
        activeMember: TeamMember.MEMBER_1,
        phase: Round2Phase.MEMBER_1,
        questions: [],
      },
    }) as unknown as TeamRoundInstance;
  }

  return {
    teamRound,
    round,
  };
}

function startPhase(
  teamRound: TeamRoundInstance,
  round: RoundDoc,
  start: Date,
  phase: Round2Phase,
) {
  const r2 = teamRound.round2!;
  const cfg = timing(round, teamRound);

  const seconds =
    phase === Round2Phase.MEMBER_1
      ? cfg.member1DurationSeconds
      : phase === Round2Phase.HANDOVER
        ? cfg.handoverDurationSeconds
        : cfg.member2DurationSeconds;

  const cap =
    globalEnd(teamRound)?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  const end = new Date(
    Math.min(
      start.getTime() + seconds * 1000,
      cap,
    ),
  );

  const member = phaseMember(phase);

  r2.phase = phase;
  r2.activeMember = member;
  r2.phaseStartedAt = start;
  r2.phaseEndsAt = end;

  const q =
    r2.questions?.[
      (r2.currentQuestionNumber ?? 1) - 1
    ];

  if (!q) return;

  q.phase = phase;
  q.activeMember = member;
  q.status = 'IN_PROGRESS';

  if (phase === Round2Phase.MEMBER_1) {
    q.member1StartedAt = start;
    q.member1EndsAt = end;
  }

  if (phase === Round2Phase.HANDOVER) {
    q.handoverStartedAt = start;
    q.handoverEndsAt = end;
  }

  if (phase === Round2Phase.MEMBER_2) {
    q.member2StartedAt = start;
    q.member2EndsAt = end;
  }
}

async function ensureInitialized(
  teamRound: TeamRoundInstance,
  round: RoundDoc,
  now: Date,
) {
  teamRound.round2 ??= {};

  const r2 = teamRound.round2;

  r2.currentQuestionNumber ??= 1;
  r2.phase ??= Round2Phase.MEMBER_1;
  r2.activeMember ??= TeamMember.MEMBER_1;

  const count =
    round.configuration?.round2?.questionCount ?? 0;

  if (!r2.questions?.length && count > 0) {
    const problems = await Problem.find({
      roundNumber: 2,
      isActive: true,
    })
      .sort({ _id: 1 })
      .limit(count)
      .lean();

    r2.questions = Array.from(
      { length: count },
      (_, i) => ({
        questionNumber: i + 1,
        problemId: problems[i]?._id,
        activeMember: null,
        phase: Round2Phase.MEMBER_1,
        status: 'PENDING',
        code: '',
        hasSeenBothPhases: false,
        member2Submitted: false,
      }),
    );
  }

  if (
    teamRound.status === TeamRoundStatus.IN_PROGRESS &&
    !r2.phaseStartedAt
  ) {
    startPhase(
      teamRound,
      round,
      now,
      Round2Phase.MEMBER_1,
    );
  }
}

async function applyLazyPhaseHandover(
  input: Round2ScopedInput,
) {
  const now = new Date(
    input.nowMs ?? Date.now(),
  );

  const {
    teamRound,
    round,
  } = await getOrCreateTeamRound(input.actor);

  await ensureInitialized(
    teamRound,
    round,
    now,
  );

  if (
    teamRound.status !==
    TeamRoundStatus.IN_PROGRESS
  ) {
    await teamRound.save();
    return;
  }

  const end = globalEnd(teamRound);

  if (end && now >= end) {
    teamRound.status =
      TeamRoundStatus.COMPLETED;

    teamRound.completedAt = end;

    teamRound.round2!.phase =
      Round2Phase.COMPLETED;

    teamRound.round2!.activeMember = null;

    await teamRound.save();
    return;
  }

  let iterations = 0;

  while (
    teamRound.round2?.phaseEndsAt &&
    now >= teamRound.round2.phaseEndsAt &&
    iterations++ < 100
  ) {
    const current =
      teamRound.round2.phase!;

    const boundary = new Date(
      teamRound.round2.phaseEndsAt,
    );

    const q =
      teamRound.round2.questions?.[
        (teamRound.round2.currentQuestionNumber ?? 1) -
          1
      ];

    if (
      current === Round2Phase.MEMBER_1
    ) {
      startPhase(
        teamRound,
        round,
        boundary,
        Round2Phase.HANDOVER,
      );
    } else if (
      current === Round2Phase.HANDOVER
    ) {
      startPhase(
        teamRound,
        round,
        boundary,
        Round2Phase.MEMBER_2,
      );
    } else if (
      current === Round2Phase.MEMBER_2
    ) {
      if (q) {
        q.hasSeenBothPhases = true;
        q.status = 'COMPLETED';
      }

      const total =
        round.configuration?.round2
          ?.questionCount ?? 0;

      if (
        (teamRound.round2.currentQuestionNumber ?? 1) >=
        total
      ) {
        teamRound.status =
          TeamRoundStatus.COMPLETED;

        teamRound.completedAt = boundary;

        teamRound.round2.phase =
          Round2Phase.COMPLETED;

        teamRound.round2.activeMember = null;

        break;
      }

      teamRound.round2.currentQuestionNumber =
        (teamRound.round2.currentQuestionNumber ?? 1) +
        1;

      startPhase(
        teamRound,
        round,
        boundary,
        Round2Phase.MEMBER_1,
      );
    } else {
      break;
    }
  }

  await teamRound.save();
}

async function getState(
  input: Round2ScopedInput,
): Promise<Round2StateView> {
  const now = new Date(
    input.nowMs ?? Date.now(),
  );

  const {
    teamRound,
    round,
  } = await getOrCreateTeamRound(input.actor);

  await ensureInitialized(
    teamRound,
    round,
    now,
  );

  const r2 = teamRound.round2!;

  const end = globalEnd(teamRound);

  const expired =
    !!end && now >= end;

  const phase =
    expired ||
    teamRound.status === TeamRoundStatus.COMPLETED
      ? Round2Phase.COMPLETED
      : r2.phase!;

  const q =
    r2.questions?.[
      (r2.currentQuestionNumber ?? 1) - 1
    ];

  const active = phaseMember(phase);

  const base =
    teamRound.status ===
      TeamRoundStatus.IN_PROGRESS &&
    !expired;

  const canSeeProblem =
    base &&
    phase === Round2Phase.MEMBER_1 &&
    input.actor.teamMember ===
      TeamMember.MEMBER_1;

  const canEditCode =
    base &&
    active === input.actor.teamMember;

  const phaseTimerExpired =
    r2.phaseEndsAt !== null &&
    r2.phaseEndsAt !== undefined &&
    now >= r2.phaseEndsAt;

  // Only Member 2 may submit for grading — Member 1 can write/edit code
  // during their phase (canEditCode above) but never submit it.
  const canSubmitCode =
    base &&
    active === input.actor.teamMember &&
    input.actor.teamMember === TeamMember.MEMBER_2 &&
    !(
      phase === Round2Phase.MEMBER_2 &&
      q?.member2Submitted
    );

  return {
    roundNumber: input.roundNumber,
    roundStatus:
      teamRound.status ??
      TeamRoundStatus.NOT_STARTED,

    globalStartTime:
      teamRound.startedAt ?? null,

    globalEndsAt: end,

    isGlobalExpired: expired,

    phase,

    activeMember: active,

    phaseStartedAt:
      r2.phaseStartedAt ?? null,

    phaseEndsAt:
      r2.phaseEndsAt ?? null,

    serverTime: now,

    currentQuestionNumber:
      r2.currentQuestionNumber ?? 1,

    totalQuestions:
      round.configuration?.round2
        ?.questionCount ??
      r2.questions?.length ??
      0,

    currentCode:
      q?.code ?? null,

    member2Submitted:
      q?.member2Submitted === true,

    allowedActions: {
      canSeeProblem,
      canEditCode,
      canSubmitCode,
      canSubmit: canSubmitCode,
      canCompleteQuestion: false,
      canStartNextQuestion: false,
    },
  };
}

async function getQuestions(
  input: Round2ScopedInput,
) {
  const state = await getState(input);

  const {
    teamRound,
  } = await getOrCreateTeamRound(
    input.actor,
  );

  const qs =
    teamRound.round2?.questions ?? [];

  const docs = await Problem.find({
    _id: {
      $in: qs
        .map(q => q.problemId)
        .filter(Boolean),
    },
  }).lean();

  const problems = new Map(
    docs.map(p => [
      String(p._id),
      p as ProblemDocument,
    ]),
  );

  return {
    roundNumber: input.roundNumber,

    currentQuestionNumber:
      state.currentQuestionNumber,

    activeMember:
      state.activeMember,

    questions: qs.map(q => ({
      questionNumber:
        q.questionNumber,

      status:
        q.status ?? 'PENDING',

      activeMember:
        q.activeMember ?? null,

      phase:
        q.phase ??
        Round2Phase.MEMBER_1,

      problemId:
        q.problemId ?? null,

      problem:
        state.allowedActions.canSeeProblem &&
        q.questionNumber ===
          state.currentQuestionNumber
          ? problems.get(
              String(q.problemId),
            ) ?? null
          : null,
    })),
  };
}

async function patchCode(
  input: Round2ScopedInput & {
    body: PatchRound2CodeInput;
  },
) {
  await applyLazyPhaseHandover(input);

  const state =
    await getState(input);

  if (
    !state.allowedActions.canEditCode
  ) {
    throw new RoundRequestError(
      'Code edits are disabled for the current Round 2 phase.',
      403,
      'CODE_EDIT_NOT_ALLOWED',
    );
  }

  const {
    teamRound,
  } = await getOrCreateTeamRound(
    input.actor,
  );

  const q =
    teamRound.round2?.questions?.[
      state.currentQuestionNumber - 1
    ];

  if (!q) {
    throw new RoundRequestError(
      'No active question.',
      404,
      'NO_ACTIVE_QUESTION',
    );
  }

  q.code =
    input.body.sourceCode;

  await teamRound.save();

  return {
    sourceCode:
      input.body.sourceCode,

    phase:
      state.phase,

    activeMember:
      state.activeMember,
  };
}

async function assertCanSubmit(
  input: Round2ScopedInput,
  problemId?: string,
) {
  await applyLazyPhaseHandover(input);

  const state =
    await getState(input);

  if (
    !state.allowedActions.canSubmitCode
  ) {
    throw new RoundRequestError(
      'Submissions are disabled for the current Round 2 phase.',
      403,
      'SUBMISSION_NOT_ALLOWED',
    );
  }

  if (problemId) {
    const {
      teamRound,
    } = await getOrCreateTeamRound(
      input.actor,
    );

    const question =
      teamRound.round2?.questions?.[
        state.currentQuestionNumber - 1
      ];

    if (
      !question?.problemId ||
      String(question.problemId) !==
        problemId
    ) {
      throw new RoundRequestError(
        'Submission must target the active Round 2 question.',
        403,
        'QUESTION_NOT_ACTIVE',
      );
    }
  }

  return state;
}

async function markSubmitted(
  input: Round2ScopedInput,
) {
  const state =
    await getState(input);

  if (
    state.phase !==
      Round2Phase.MEMBER_2 ||
    input.actor.teamMember !==
      TeamMember.MEMBER_2
  ) {
    return;
  }

  const {
    teamRound,
  } = await getOrCreateTeamRound(
    input.actor,
  );

  const q =
    teamRound.round2?.questions?.[
      state.currentQuestionNumber - 1
    ];

  if (q) {
    q.member2Submitted = true;
    await teamRound.save();
  }
}

async function complete(
  input: Round2ScopedInput & {
    body: PostRound2CompleteInput;
  },
) {
  await applyLazyPhaseHandover(input);

  const state =
    await getState(input);

  throw new RoundRequestError(
    state.phase === Round2Phase.MEMBER_2
      ? 'The Member 2 phase must run to its server deadline before the next question unlocks.'
      : 'Questions advance automatically after the full Member 2 phase.',
    403,
    'COMPLETE_NOT_ALLOWED',
  );
}

async function start(
  input: Round2ScopedInput,
) {
  const now = new Date(
    input.nowMs ?? Date.now(),
  );

  const {
    teamRound,
    round,
  } = await getOrCreateTeamRound(
    input.actor,
  );

  if (
    teamRound.status ===
    TeamRoundStatus.NOT_STARTED
  ) {
    teamRound.status =
      TeamRoundStatus.IN_PROGRESS;

    teamRound.startedAt = now;

    teamRound.endsAt = new Date(
      now.getTime() +
        (round.durationSeconds ?? 3600) *
          1000,
    );

    teamRound.round2 ??= {};

    teamRound.round2.configSnapshot =
      timing(round, teamRound);

    await ensureInitialized(
      teamRound,
      round,
      now,
    );

    await teamRound.save();
  }

  await applyLazyPhaseHandover(input);

  return getState(input);
}

async function updateActiveTiming(
  roundId: unknown,
  config: Timing & {
    totalDurationSeconds: number;
  },
) {
  const sessions =
    await TeamRound.find({
      roundId: roundId as any,
      status:
        TeamRoundStatus.IN_PROGRESS,
    });

  for (const session of sessions) {
    const teamRound =
      session as unknown as TeamRoundInstance;

    if (
      !teamRound.startedAt ||
      !teamRound.round2?.phaseStartedAt
    ) {
      continue;
    }

    teamRound.endsAt =
      new Date(
        teamRound.startedAt.getTime() +
          config.totalDurationSeconds *
            1000,
      );

    teamRound.round2.configSnapshot = {
      member1DurationSeconds:
        config.member1DurationSeconds,

      handoverDurationSeconds:
        config.handoverDurationSeconds,

      member2DurationSeconds:
        config.member2DurationSeconds,
    };

    const phase =
      teamRound.round2.phase ??
      Round2Phase.MEMBER_1;

    const seconds =
      phase === Round2Phase.MEMBER_1
        ? config.member1DurationSeconds
        : phase === Round2Phase.HANDOVER
          ? config.handoverDurationSeconds
          : config.member2DurationSeconds;

    const end =
      new Date(
        Math.min(
          teamRound.round2.phaseStartedAt.getTime() +
            seconds * 1000,
          teamRound.endsAt.getTime(),
        ),
      );

    teamRound.round2.phaseEndsAt =
      end;

    const question =
      teamRound.round2.questions?.[
        (teamRound.round2.currentQuestionNumber ?? 1) -
          1
      ];

    if (question) {
      if (
        phase === Round2Phase.MEMBER_1
      ) {
        question.member1EndsAt = end;
      }

      if (
        phase === Round2Phase.HANDOVER
      ) {
        question.handoverEndsAt = end;
      }

      if (
        phase === Round2Phase.MEMBER_2
      ) {
        question.member2EndsAt = end;
      }
    }

    await teamRound.save();
  }
}

export function roundErrorResponse(
  error: unknown,
): NextResponse {
  if (
    error instanceof RoundRequestError
  ) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      {
        status: error.status,
      },
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error.',
      code: 'INTERNAL_ERROR',
    },
    {
      status: 500,
    },
  );
}

export const roundService = {
  resolveActor,
  applyLazyPhaseHandover,
  getState,
  getQuestions,
  patchCode,
  assertCanSubmit,
  markSubmitted,
  complete,
  start,
  updateActiveTiming,
};