import { NextResponse } from 'next/server';

import { createSession } from '../../_lib/auth';
import { errorResponse } from '../../_lib/response';
import { loginAdmin } from '../../_services/auth.service';
import { validateAdminLoginInput } from '../../_validators/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const input = validateAdminLoginInput(body);

    const user = await loginAdmin(input);

    const token = await createSession({
      userId: user.id,
      teamId: user.teamId,
      teamMember: user.teamMember,
      role: user.role,
      sessionId: user.sessionId,
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user,
      },
      { status: 200 },
    );

    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
