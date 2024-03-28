import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { userUsage } from '@/services/usage';

export async function GET(request: NextRequest, params?: any) {
  const { user } = await userSession(request);
  console.log('>> app.api.user.GET', { user });

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const usage = await userUsage(user);

  return NextResponse.json({
    user: {
      ...user,
      usage,
    }
  });
}
