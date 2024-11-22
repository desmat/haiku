import { searchParamsToMap } from '@desmat/utils';
import { NextRequest, NextResponse } from 'next/server'
import { createHaikudle, getHaikudle, getUserHaikudle, getDailyHaikudle, saveDailyHaikudle, getNextDailyHaikudleId } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { getHaiku } from '@/services/haikus';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikudles.GET', { query, searchParams: request.nextUrl.searchParams.toString() });

  const { user } = await userSession(request);

  let { haikudle, dailyHaikudle } = await getDailyHaikudle();

  console.log('>> app.api.haikudles.GET', { dailyHaikudle });

  if (!dailyHaikudle) {
    return NextResponse.json({ dailyHaikudle: {} }, { status: 404 });
  }

  let [
    haiku,
    userHaikudle
  ] = await Promise.all([
    getHaiku(user, dailyHaikudle.haikuId, true),
    getUserHaikudle(user?.id, dailyHaikudle?.haikuId),
  ]);

  console.log('>> app.api.haikudles.GET', { haiku, haikudle, userHaikudle });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  if (!haikudle) {
    // no puzzle for this haiku yet: create one
    haikudle = await createHaikudle(user, { id: haiku.id, haikuId: haiku.id });
  }

  const ret = {
    ...haikudle,
    ...userHaikudle?.haikudle,
    haiku,
  }

  return NextResponse.json({ haikudles: [ret] });
}

export async function POST(request: Request) {
  console.log('>> app.api.haikudles.POST');

  // TODO: move this to api/haikudle/id/daily to follow haiku pattern

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const data: any = await request.json();
  const haikudle = data.haikudle;

  console.log('>> app.api.haikus.POST', { haikudle });

  // TODO create haikudle with same ID as the haiku, and the daily haikudle with id YYYYMMDD

  const [createdHaikudle, createdDailyHaikudle] = await Promise.all([
    await createHaikudle(user, haikudle),
    await saveDailyHaikudle(user, haikudle.dateCode, haikudle.haikuId, haikudle.id),
  ]);
  const nextDailyHaikudleId = await getNextDailyHaikudleId();

  return NextResponse.json({
    haikudle: createdHaikudle,
    dailyHaikudle: createdDailyHaikudle,
    nextDailyHaikudleId
  });
}
