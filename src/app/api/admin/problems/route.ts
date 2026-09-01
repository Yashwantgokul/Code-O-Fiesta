import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Problem from '@/models/Problem';
import { requireAdmin } from '@/app/api/_lib/authorization';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const roundNumber = searchParams.get('roundNumber');

    await connectDB();

    let query: any = {};
    if (roundNumber) {
      const parsed = parseInt(roundNumber, 10);
      if (isNaN(parsed) || ![1, 2, 3].includes(parsed)) {
        return NextResponse.json({ error: 'Invalid roundNumber' }, { status: 400 });
      }
      query.roundNumber = parsed;
    }

    const problems = await Problem.find(query).sort({ roundNumber: 1, createdAt: -1 });

    return NextResponse.json(problems);
  } catch (error: any) {
    console.error('Error fetching problems for admin:', error);
    return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    // Whitelist only known fields — never pass raw body to create()
    const {
      title,
      description,
      difficulty,
      roundNumber,
      topic,
      constraints,
      inputFormat,
      outputFormat,
      examples,
      visibleTestCases,
      hiddenTestCases,
      allowedLanguages,
      round3Constraints,
      cpuTimeLimit,
      memoryLimit,
      isActive,
    } = body;

    await connectDB();

    const newProblem = await Problem.create({
      title,
      description,
      difficulty,
      roundNumber,
      topic,
      constraints,
      inputFormat,
      outputFormat,
      examples: examples ?? [],
      visibleTestCases: visibleTestCases ?? [],
      hiddenTestCases: hiddenTestCases ?? [],
      allowedLanguages: allowedLanguages ?? ['cpp'],
      round3Constraints: round3Constraints ?? {},
      cpuTimeLimit: cpuTimeLimit ?? 2.0,
      memoryLimit: memoryLimit ?? 128000,
      isActive: isActive ?? true,
    });

    return NextResponse.json(newProblem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating problem:', error);
    return NextResponse.json({ error: error.message }, { status: error.status ?? 500 });
  }
}
