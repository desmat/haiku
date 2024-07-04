import { NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { backup } from '@/services/admin';

export const maxDuration = 300;

export async function POST(request: Request) {
  console.log('>> app.api.admin.backup.POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const ret = await backup(user);
  console.log('>> app.api.admin.backup.POST', { ret });

  return NextResponse.json(ret);
}
