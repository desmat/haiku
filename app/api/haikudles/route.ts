import { NextRequest, NextResponse } from 'next/server'
import { getHaikudles, createHaikudle, getHaikudle, getUserHaikudle, getDailyHaikudle, saveDailyHaikudle, getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';
import moment from 'moment';
import { getDailyHaikus, getHaiku, getHaikus } from '@/services/haikus';
import { DailyHaikudle, Haikudle } from '@/types/Haikudle';
import shuffleArray from '@/utils/shuffleArray';
import { DailyHaiku, Haiku } from '@/types/Haiku';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikudles.GET', { query, searchParams: request.nextUrl.searchParams.toString() });

  const { user } = await userSession(request);

  let todaysHaikudle = await getDailyHaikudle();

  console.log('>> app.api.haikudles.GET', { todaysHaikudle });

  if (!todaysHaikudle) {
    return NextResponse.json({ todaysHaikudle: {} }, { status: 404 });
  }

  let [
    haiku,
    haikudle,
    userHaikudle
  ] = await Promise.all([
    getHaiku(user, todaysHaikudle.haikuId, true),
    getHaikudle(user, todaysHaikudle.haikuId),
    getUserHaikudle(user?.id, todaysHaikudle?.haikuId),
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
