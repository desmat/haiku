import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { backup } from '@/services/admin';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('app.api.admin.backup.POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const haikuIds = request.nextUrl.searchParams.get("haiku");
  const entities = request.nextUrl.searchParams.get("entity");
  console.log('app.api.admin.backup.POST', { haikuIds, entities });
  const ret = await backup(user, (entities ?? "").split(",").filter(Boolean), (haikuIds ?? "").split(",").filter(Boolean));
  console.log('app.api.admin.backup.POST', { ret });

  return NextResponse.json(ret);
}
