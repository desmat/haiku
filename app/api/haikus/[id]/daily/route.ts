import { NextResponse } from 'next/server'
import { getHaiku, saveDailyHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';

// export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('>> app.api.haiku.[id].daily POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const data: any = await request.json();
  const { dateCode, haikuId } = data;

  console.log('>> app.api.haikus.[id].daily POST', { dateCode, haikuId });

  const haiku = await getHaiku(haikuId);

  if (!haiku) {
    return NextResponse.json(
      { success: false, message: 'haiku not found' },
      { status: 400 }
    );
  }

  const dailyHaiku = await saveDailyHaiku(user, dateCode, haikuId);

  return NextResponse.json({ dailyHaiku });
}
