import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { userUsage } from '@/services/usage';
import { getDailyHaikus, getNextDailyHaikuId, getUserHaikus } from '@/services/haikus';
import { getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';

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
  // console.log('>> app.api.user.GET', { usage });

  let userHaikus = {
    haikus: await getUserHaikus(user), 
  } as any;

  if (user.isAdmin) {
    const [
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    ] = await Promise.all([
      await getUserHaikus(user, true),
      await getDailyHaikus(),
      await getDailyHaikudles(),
      await getNextDailyHaikuId(),
      await getNextDailyHaikudleId(),      
    ]);

    userHaikus = {
      ...userHaikus,
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    }
  }

  return NextResponse.json({
    user: {
      ...user,
      usage,
    },
    ...userHaikus,
  });
}
