import { NextRequest, NextResponse } from 'next/server'
import { getHaikudles, createHaikudle, getHaikudle, getUserHaikudle, getDailyHaikudle, saveDailyHaikudle, getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { searchParamsToMap, uuid } from '@/utils/misc';
import moment from 'moment';
import { getHaiku, getHaikus } from '@/services/haikus';
import { DailyHaikudle, Haikudle } from '@/types/Haikudle';
import shuffleArray from '@/utils/shuffleArray';
import { Haiku } from '@/types/Haiku';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikudles.GET', { query, searchParams: request.nextUrl.searchParams.toString() });

  const { user } = await userSession(request);

  const todaysDateCode = moment().format("YYYYMMDD");
  let todaysHaikudle = await getDailyHaikudle(todaysDateCode);

  console.log('>> app.api.haikudles.GET', { todaysDateCode, todaysHaikudle });

  if (!todaysHaikudle) {
    // create a new haikudle and dailyhaikudle combo

    const [previousDailyHaikudles, haikudles, haikus] = await Promise.all([
      getDailyHaikudles(),
      getHaikudles(),
      getHaikus(),
    ]);
    const previousDailyHaikuIds = previousDailyHaikudles.map((dailyHaikudle: DailyHaikudle) => dailyHaikudle.haikuId);
    const nonDailyhaikus = haikus.filter((haiku: Haiku) => !previousDailyHaikuIds.includes(haiku.id));
    const randomHaikuId = shuffleArray(nonDailyhaikus)[0].id;
    const randomHaikudle = await createHaikudle(user, { id: randomHaikuId, haikuId: randomHaikuId });

    console.log('>> app.api.haikudles.GET', { randomHaikuId, randomHaikudle, previousDailyHaikudles, haikudles });

    todaysHaikudle = await saveDailyHaikudle(user, todaysDateCode, randomHaikudle.haikuId, randomHaikudle.id);
  }

  let [haiku, haikudle, userHaikudle, nextDailyHaikudleId] = await Promise.all([
    getHaiku(todaysHaikudle.haikuId, true),
    getHaikudle(todaysHaikudle.haikuId),
    getUserHaikudle(user?.id, todaysHaikudle?.haikuId),
    getNextDailyHaikudleId(),
  ]);

  console.log('>> app.api.haikudles.GET', { haiku, haikudle, userHaikudle, nextDailyHaikudleId });

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

  return NextResponse.json(
    nextDailyHaikudleId && user.isAdmin
      // TODO move this to /api/haikudles?mine=true to follow haiku pattern
      ? { haikudles: [ret], nextDailyHaikudleId }
      : { haikudles: [ret] }
  );
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

  return NextResponse.json({ haikudle: createdHaikudle });
}
