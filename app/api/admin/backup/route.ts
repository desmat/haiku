import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { backup } from '@/services/admin';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('>> app.api.admin.backup.POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const haikuId = request.nextUrl.searchParams.get("haiku");
  const ret = await backup(user, haikuId);
  console.log('>> app.api.admin.backup.POST', { ret });

  return NextResponse.json(ret);
}
