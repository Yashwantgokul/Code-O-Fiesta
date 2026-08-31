import argon2 from 'argon2';
import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import connectDB from '../src/lib/db';

import Problem from '../src/models/Problem';
import Round from '../src/models/Round';
import Score from '../src/models/Score';
import Submission from '../src/models/Submission';
import Team from '../src/models/Team';
import TeamRound from '../src/models/TeamRound';
import User from '../src/models/User';

import {
  ProblemDifficulty,
  ProblemTopic,
  Round1Path,
  Round1Topic,
  RoundStatus,
  SubmissionVerdict,
  TeamMember,
  TeamRoundStatus,
  TeamStatus,
  UserRole,
} from '../src/constants/event';

const DEMO_TEAM_CODE = 'TEST001';
const DEMO_EMAIL = 'team@test.com';
const DEMO_PASSWORD = 'TestPassword123';
const CLEANUP_MODE = process.argv.includes('--cleanup');

const PARTICIPANT_ACCOUNTS = [
  {
    name: 'Test Participant 1',
    email: 'participant1@test.com',
    password: 'Participant@123',
    teamCode: 'TEST001',
    teamName: 'Test Team 1',
    teamMember: TeamMember.MEMBER_1,
  },
  {
    name: 'Test Participant 1 (Member 2)',
    email: 'participant1@test.com',
    password: 'Participant@123',
    teamCode: 'TEST001',
    teamName: 'Test Team 1',
    teamMember: TeamMember.MEMBER_2,
  },
  {
    name: 'Test Participant 2',
    email: 'participant2@test.com',
    password: 'Participant@123',
    teamCode: 'TEST002',
    teamName: 'Test Team 2',
    teamMember: TeamMember.MEMBER_1,
  },
  {
    name: 'Test Participant 2 (Member 2)',
    email: 'participant2@test.com',
    password: 'Participant@123',
    teamCode: 'TEST002',
    teamName: 'Test Team 2',
    teamMember: TeamMember.MEMBER_2,
  },
  {
    name: 'Test Participant 3',
    email: 'participant3@test.com',
    password: 'Participant@123',
    teamCode: 'TEST003',
    teamName: 'Test Team 3',
    teamMember: TeamMember.MEMBER_1,
  },
  {
    name: 'Test Participant 3 (Member 2)',
    email: 'participant3@test.com',
    password: 'Participant@123',
    teamCode: 'TEST003',
    teamName: 'Test Team 3',
    teamMember: TeamMember.MEMBER_2,
  },
] as const;

const ADMIN_ACCOUNT = {
  name: 'Test Admin',
  email: 'admin@test.com',
  password: 'Admin@123',
};

const MODELS = [
  { name: 'User', model: User },
  { name: 'Team', model: Team },
  { name: 'Round', model: Round },
  { name: 'Problem', model: Problem },
  { name: 'TeamRound', model: TeamRound },
  { name: 'Submission', model: Submission },
  { name: 'Score', model: Score },
];

const ROUND_1_PROBLEMS = [
  {
    title: 'Path of Digits',
    description: 'Given a positive integer n, compute the sum of its digits.',
    difficulty: ProblemDifficulty.EASY,
    roundNumber: 1,
    topic: ProblemTopic.BASIC_MATH_NUMBERS,
    constraints: '1 <= n <= 10^9',
    inputFormat: 'Single integer n',
    outputFormat: 'Print digit sum',
    examples: [{ input: '1234', output: '10', explanation: '1 + 2 + 3 + 4 = 10' }],
    visibleTestCases: [{ input: '1234', expectedOutput: '10' }],
    hiddenTestCases: [{ input: '99999', expectedOutput: '45' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
  {
    title: 'Mirror String',
    description: 'Reverse the given string and print it.',
    difficulty: ProblemDifficulty.MEDIUM,
    roundNumber: 1,
    topic: ProblemTopic.STRING_MANIPULATION,
    constraints: '1 <= |s| <= 10^5',
    inputFormat: 'Single string s',
    outputFormat: 'Print reversed string',
    examples: [{ input: 'hello', output: 'olleh', explanation: 'String reversed.' }],
    visibleTestCases: [{ input: 'hello', expectedOutput: 'olleh' }],
    hiddenTestCases: [{ input: 'code', expectedOutput: 'edoc' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
  {
    title: 'Max Subarray',
    description: 'Find the maximum sum of a contiguous subarray.',
    difficulty: ProblemDifficulty.HARD,
    roundNumber: 1,
    topic: ProblemTopic.ARRAYS_LOGIC,
    constraints: '1 <= n <= 2 * 10^5',
    inputFormat: 'n followed by array elements',
    outputFormat: 'Print maximum subarray sum',
    examples: [{ input: '5\n-2 1 -3 4 -1', output: '6', explanation: 'Largest subarray sum is 6.' }],
    visibleTestCases: [{ input: '5\n-2 1 -3 4 -1', expectedOutput: '6' }],
    hiddenTestCases: [{ input: '4\n1 2 3 4', expectedOutput: '10' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
];

const ROUND_2_PROBLEMS = [
  {
    title: 'Two Sum Pair',
    description: 'Given an array and target, print the pair indices.',
    difficulty: ProblemDifficulty.EASY,
    roundNumber: 2,
    topic: ProblemTopic.ARRAYS_LOGIC,
    constraints: '1 <= n <= 10^5',
    inputFormat: 'n, target, array',
    outputFormat: 'Print indices of matching pair',
    examples: [{ input: '4\n9\n2 7 11 15', output: '0 2', explanation: '2 + 7 = 9' }],
    visibleTestCases: [{ input: '4\n9\n2 7 11 15', expectedOutput: '0 2' }],
    hiddenTestCases: [{ input: '3\n6\n1 2 3', expectedOutput: '0 1' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
  {
    title: 'Pattern Runner',
    description: 'Print the required number pattern.',
    difficulty: ProblemDifficulty.MEDIUM,
    roundNumber: 2,
    topic: ProblemTopic.LOOPS_PATTERNS,
    constraints: '1 <= n <= 20',
    inputFormat: 'Single integer n',
    outputFormat: 'Print pattern',
    examples: [{ input: '5', output: '1\n12\n123\n1234\n12345', explanation: 'Pattern ascending rows.' }],
    visibleTestCases: [{ input: '5', expectedOutput: '1\n12\n123\n1234\n12345' }],
    hiddenTestCases: [{ input: '3', expectedOutput: '1\n12\n123' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
  {
    title: 'Char Frequency',
    description: 'Find the most frequent character in a string.',
    difficulty: ProblemDifficulty.HARD,
    roundNumber: 2,
    topic: ProblemTopic.STRING_MANIPULATION,
    constraints: '1 <= |s| <= 10^5',
    inputFormat: 'Single string s',
    outputFormat: 'Print most frequent character',
    examples: [{ input: 'banana', output: 'a', explanation: 'a appears 3 times' }],
    visibleTestCases: [{ input: 'banana', expectedOutput: 'a' }],
    hiddenTestCases: [{ input: 'programming', expectedOutput: 'g' }],
    allowedLanguages: ['cpp', 'python', 'javascript'],
    round3Constraints: { recursionRequired: false, noLoops: false, maxLines: null },
    isActive: true,
  },
];

const ROUND_3_PROBLEMS = [
  {
    title: 'Digital Root Reducer',
    description: 'Compute the digital root of a number repeated until single digit remains.',
    difficulty: ProblemDifficulty.EASY,
    roundNumber: 3,
    topic: ProblemTopic.BASIC_MATH_NUMBERS,
    constraints: '0 <= n <= 10^9',
    inputFormat: 'Single integer n',
    outputFormat: 'Print digital root',
    examples: [{ input: '38', output: '2', explanation: '3 + 8 = 11, 1 + 1 = 2' }],
    visibleTestCases: [{ input: '38', expectedOutput: '2' }],
    hiddenTestCases: [{ input: '12345', expectedOutput: '6' }],
    allowedLanguages: ['cpp', 'python', 'javascript', 'java'],
    round3Constraints: { recursionRequired: true, noLoops: true, maxLines: 25 },
    isActive: true,
  },
  {
    title: 'Recursive Fibonacci',
    description: 'Find the nth Fibonacci number efficiently.',
    difficulty: ProblemDifficulty.MEDIUM,
    roundNumber: 3,
    topic: ProblemTopic.ARRAYS_LOGIC,
    constraints: '0 <= n <= 30',
    inputFormat: 'Single integer n',
    outputFormat: 'Print nth Fibonacci number',
    examples: [{ input: '5', output: '5', explanation: 'F(5) = 5' }],
    visibleTestCases: [{ input: '5', expectedOutput: '5' }],
    hiddenTestCases: [{ input: '10', expectedOutput: '55' }],
    allowedLanguages: ['cpp', 'python', 'javascript', 'java'],
    round3Constraints: { recursionRequired: true, noLoops: true, maxLines: 30 },
    isActive: true,
  },
  {
    title: 'Grid Paths',
    description: 'Count all unique paths from top-left to bottom-right in a grid.',
    difficulty: ProblemDifficulty.HARD,
    roundNumber: 3,
    topic: ProblemTopic.ARRAYS_LOGIC,
    constraints: '1 <= m, n <= 12',
    inputFormat: 'Two integers m and n',
    outputFormat: 'Print number of unique paths',
    examples: [{ input: '2 3', output: '3', explanation: 'There are 3 paths.' }],
    visibleTestCases: [{ input: '2 3', expectedOutput: '3' }],
    hiddenTestCases: [{ input: '3 3', expectedOutput: '6' }],
    allowedLanguages: ['cpp', 'python', 'javascript', 'java'],
    round3Constraints: { recursionRequired: true, noLoops: false, maxLines: 30 },
    isActive: true,
  },
];

async function upsertRound(roundNumber: number, config: any) {
  const round = await Round.findOneAndUpdate(
    { roundNumber },
    {
      $set: {
        ...config,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return round;
}

async function upsertProblemsForRound(roundNumber: number, problems: any[]) {
  const created: any[] = [];

  for (const problemData of problems) {
    const problem = await Problem.findOneAndUpdate(
      { title: problemData.title, roundNumber },
      { $set: problemData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    created.push(problem);
  }

  return created;
}

async function ensureTeamAndUsers() {
  const participantPasswordHash = await argon2.hash(PARTICIPANT_ACCOUNTS[0].password);
  const adminPasswordHash = await argon2.hash(ADMIN_ACCOUNT.password);

  const createdTeams: any[] = [];
  const createdParticipants: any[] = [];

  for (const account of PARTICIPANT_ACCOUNTS) {
    let team = await Team.findOne({ teamCode: account.teamCode });
    if (!team) {
      team = await Team.create({
        teamCode: account.teamCode,
        name: account.teamName,
        members: [],
        captainId: null,
        status: TeamStatus.ACTIVE,
      });
    }

    const member = await User.findOneAndUpdate(
      { email: account.email, teamMember: account.teamMember },
      {
        $set: {
          name: account.name,
          passwordHash: participantPasswordHash,
          role: UserRole.PARTICIPANT,
          teamId: team._id,
          teamMember: account.teamMember,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    team.members = Array.from(new Set([...(team.members ?? []).map((id: any) => id.toString()), member._id.toString()])).map((id) => new mongoose.Types.ObjectId(id));
    team.captainId = team.captainId ?? member._id;
    await team.save();

    createdTeams.push(team);
    createdParticipants.push(member);
  }

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_ACCOUNT.email },
    {
      $set: {
        name: ADMIN_ACCOUNT.name,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        teamId: null,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const judge = await User.findOneAndUpdate(
    { email: 'judge@test.com' },
    {
      $set: {
        name: 'Test Judge',
        passwordHash: adminPasswordHash,
        role: UserRole.JUDGE,
        teamId: null,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { teams: createdTeams, participants: createdParticipants, admin, judge };
}

async function seedRound1State(teamId: mongoose.Types.ObjectId, roundId: mongoose.Types.ObjectId, problems: any[]) {
  const round1Problems = problems.map((problem) => ({
    problemId: problem._id,
    status: 'PENDING',
  }));

  await TeamRound.findOneAndUpdate(
    { teamId, roundId },
    {
      $set: {
        teamId,
        roundId,
        status: TeamRoundStatus.IN_PROGRESS,
        startedAt: new Date(),
        score: 0,
        currentProblemId: problems[0]._id,
        'round1.selectedPath': Round1Path.TRIANGLE,
        'round1.revealedTopic': Round1Topic.BASIC_MATH_NUMBERS,
        'round1.selectedAt': new Date(),
        'round1.problems': round1Problems,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedRound2State(teamId: mongoose.Types.ObjectId, roundId: mongoose.Types.ObjectId, problems: any[]) {
  const questions = problems.map((problem, index) => ({
    questionNumber: index + 1,
    problemId: problem._id,
    activeMember: TeamMember.MEMBER_1,
    phase: 'MEMBER_1',
    member1StartedAt: new Date(),
    member1EndsAt: new Date(Date.now() + 1000 * 60 * 15),
    member2StartedAt: null,
    member2EndsAt: null,
    status: 'PENDING',
    code: '',
    hasSeenBothPhases: false,
  }));

  await TeamRound.findOneAndUpdate(
    { teamId, roundId },
    {
      $set: {
        teamId,
        roundId,
        status: TeamRoundStatus.IN_PROGRESS,
        startedAt: new Date(),
        score: 0,
        'round2.currentQuestionNumber': 1,
        'round2.activeMember': TeamMember.MEMBER_1,
        'round2.phase': 'MEMBER_1',
        'round2.phaseStartedAt': new Date(),
        'round2.phaseEndsAt': new Date(Date.now() + 1000 * 60 * 30),
        'round2.questions': questions,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedRound3State(teamId: mongoose.Types.ObjectId, roundId: mongoose.Types.ObjectId, problems: any[]) {
  const round3Problems = problems.map((problem, index) => ({
    problemId: problem._id,
    baseSolvePassed: index === 0,
    ouroborosPassed: false,
    shortAndSweetPassed: false,
    oneShotWonderPassed: false,
    baseScore: index === 0 ? 50 : 0,
    bonusScore: 0,
    totalScore: index === 0 ? 50 : 0,
    submissionCount: index === 0 ? 1 : 0,
    wrongSubmissionCount: index === 0 ? 1 : 0,
    completedAt: index === 0 ? new Date() : null,
  }));

  await TeamRound.findOneAndUpdate(
    { teamId, roundId },
    {
      $set: {
        teamId,
        roundId,
        status: TeamRoundStatus.IN_PROGRESS,
        startedAt: new Date(),
        score: 50,
        'round3.currentProblemId': problems[0]._id,
        'round3.problems': round3Problems,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seedSampleSubmissions(teamId: mongoose.Types.ObjectId, roundId: mongoose.Types.ObjectId, problems: any[], roundNumber: number) {
  const sampleCodeByLanguage: Record<string, string> = {
    cpp: '#include <iostream>\nusing namespace std;\nint main(){ cout << "ok"; }',
    python: 'print("ok")',
    javascript: 'console.log("ok")',
  };

  const demoUser = await User.findOne({ email: DEMO_EMAIL, teamMember: TeamMember.MEMBER_1 });
  if (!demoUser) {
    throw new Error(`No user found with email ${DEMO_EMAIL} and teamMember ${TeamMember.MEMBER_1}`);
  }

  for (const [idx, problem] of problems.entries()) {
    const verdict = idx === 0 ? SubmissionVerdict.ACCEPTED : SubmissionVerdict.WRONG_ANSWER;

    await Submission.findOneAndUpdate(
      {
        teamId,
        problemId: problem._id,
        roundId,
        submissionNumber: 1,
      },
      {
        $set: {
          teamId,
          userId: demoUser._id,
          roundId,
          problemId: problem._id,
          sourceCode: sampleCodeByLanguage[problem.allowedLanguages?.[0] ?? 'python'] ?? 'print("ok")',
          language: problem.allowedLanguages?.[0] ?? 'python',
          submissionNumber: 1,
          verdict,
          submittedAt: new Date(),
          'judge0.token': 'sample-token',
          'judge0.status': verdict === SubmissionVerdict.ACCEPTED ? 'Accepted' : 'Wrong Answer',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}

async function seedScores(teamId: mongoose.Types.ObjectId, roundId: mongoose.Types.ObjectId, roundNumber: number) {
  await Score.findOneAndUpdate(
    { teamId, roundId },
    {
      $set: {
        teamId,
        roundId,
        baseScore: roundNumber === 3 ? 50 : 60,
        bonusScore: roundNumber === 3 ? 10 : 0,
        totalScore: roundNumber === 3 ? 60 : 60,
        breakdown: {
          baseSolve: roundNumber === 3 ? 50 : 60,
          ouroboros: roundNumber === 3 ? 10 : 0,
          shortAndSweet: 0,
          oneShotWonder: 0,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function main() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    console.log('Registered models:');
    for (const item of MODELS) {
      console.log('-', item.name, '->', item.model.modelName || item.name);
    }

    if (CLEANUP_MODE) {
      await Promise.all([
        User.deleteMany({ email: { $in: [DEMO_EMAIL, 'admin@test.com', 'judge@test.com'] } }),
        Team.deleteMany({ teamCode: DEMO_TEAM_CODE }),
        Problem.deleteMany({ roundNumber: { $in: [1, 2, 3] } }),
        Round.deleteMany({ roundNumber: { $in: [1, 2, 3] } }),
        TeamRound.deleteMany({ teamId: { $exists: true } }),
        Submission.deleteMany({ teamId: { $exists: true } }),
        Score.deleteMany({ teamId: { $exists: true } }),
      ]);
      console.log('Cleanup complete.');
      return;
    }

    const { teams, participants, admin } = await ensureTeamAndUsers();

    const round1Doc = await upsertRound(1, {
      name: 'Round 1',
      status: RoundStatus.UPCOMING,
      durationSeconds: 3600,
      startedAt: null,
      endsAt: null,
      configuration: {
        problemCount: ROUND_1_PROBLEMS.length,
        round1: {
          paths: [
            { shape: Round1Path.TRIANGLE, topic: Round1Topic.BASIC_MATH_NUMBERS },
            { shape: Round1Path.CIRCLE, topic: Round1Topic.STRING_MANIPULATION },
            { shape: Round1Path.SQUARE, topic: Round1Topic.ARRAYS_LOGIC },
            { shape: Round1Path.STAR, topic: Round1Topic.LOOPS_PATTERNS },
          ],
        },
      },
    });

    const round2Doc = await upsertRound(2, {
      name: 'Round 2',
      status: RoundStatus.UPCOMING,
      durationSeconds: 1800,
      startedAt: null,
      endsAt: null,
      configuration: {
        problemCount: ROUND_2_PROBLEMS.length,
        round2: {
          questionCount: ROUND_2_PROBLEMS.length,
          member1Seconds: 900,
          member2Seconds: 900,
          overallDurationSeconds: 1800,
        },
      },
    });

    const round3Doc = await upsertRound(3, {
      name: 'Round 3',
      status: RoundStatus.UPCOMING,
      durationSeconds: 3600,
      startedAt: null,
      endsAt: null,
      configuration: {
        problemCount: ROUND_3_PROBLEMS.length,
        round3: {
          basePoints: 50,
          ouroborosPoints: 30,
          shortAndSweetPoints: 20,
          oneShotWonderPoints: 40,
          maxLines: 30,
        },
      },
    });

    const r1Problems = await upsertProblemsForRound(1, ROUND_1_PROBLEMS);
    const r2Problems = await upsertProblemsForRound(2, ROUND_2_PROBLEMS);
    const r3Problems = await upsertProblemsForRound(3, ROUND_3_PROBLEMS);

    await Promise.all([
      TeamRound.deleteMany({ teamId: { $in: teams.map((team) => team._id) } }),
      Submission.deleteMany({ teamId: { $in: participants.map((user) => user.teamId) } }),
      Score.deleteMany({ teamId: { $in: teams.map((team) => team._id) } }),
    ]);

    console.log('\nSeed complete.');
    console.log('Participant accounts:');
    for (const account of PARTICIPANT_ACCOUNTS) {
      console.log('-', account.email, ' / ', account.password, ' / Team:', account.teamCode);
    }
    console.log('Admin account:');
    console.log('-', ADMIN_ACCOUNT.email, ' / ', ADMIN_ACCOUNT.password);
    console.log('Round status:', {
      round1: round1Doc.status,
      round2: round2Doc.status,
      round3: round3Doc.status,
    });
    console.log('All participant progress reset: no rounds started, no questions solved.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
