import { NextRequest, NextResponse } from 'next/server'
import { getHaikudles, createHaikudle, getHaikudle, getUserHaikudle, getDailyHaikudle, saveDailyHaikudle } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { searchParamsToMap, uuid } from '@/utils/misc';
import moment from 'moment';
import { getHaiku } from '@/services/haikus';

// TODO I don't think we need this let's remove
// export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikudles.GET', { query, searchParams: request.nextUrl.searchParams.toString() });

  const { user } = await userSession(request);

  const todaysDateCode = moment().format("YYYYMMDD");
  const todaysHaikudle = await getDailyHaikudle(todaysDateCode);
  
  console.log('>> app.api.haikudles.GET', { todaysDateCode, todaysHaikudle });

  if (!todaysHaikudle) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }
  
  const [haiku, haikudle, userHaikudle] = await Promise.all([
    getHaiku(todaysHaikudle.haikuId, true),
    getHaikudle(todaysHaikudle.haikuId),
    getUserHaikudle(`${todaysHaikudle.haikuId}-${user?.id}`),
  ]);

  console.log('>> app.api.haikudles.GET', { haiku, haikudle, userHaikudle });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  if (!haikudle) {
    return NextResponse.json({ haikudle: {} }, { status: 404 });
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

  const { user } = await userSession(request);

  // TODO lock down to admins

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
