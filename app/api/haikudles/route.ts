import { NextRequest, NextResponse } from 'next/server'
import { getHaikudles, createHaikudle, getHaikudle, getUserHaikudle } from '@/services/haikudles';
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

  // TODO lock down to admins

  const { user } = await userSession(request);
  // TODO reject?

  const todaysDateCode = moment().format("YYYYMMDD");
  const todaysHaikudle = await getHaikudle(todaysDateCode);
  
  console.log('>> app.api.haikudles.GET', { todaysDateCode, todaysHaikudle });

  if (!todaysHaikudle) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }
  
  const haiku = todaysHaikudle && await getHaiku(todaysHaikudle.haikuId);

  console.log('>> app.api.haikudles.GET', { haiku });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const userHaikudle = await getUserHaikudle(`${todaysHaikudle.haikuId}-${user?.id}`);  
  const haikudle = userHaikudle?.haikudle;
  console.log('>> app.api.haikudles.GET', { userHaikudle, haikudle });

  const ret = {
    ...todaysHaikudle,
    ...haikudle,
    haiku,
  }

  return NextResponse.json({ haikudles: [ret] });
}

export async function POST(request: Request) {
  console.log('>> app.api.haikus.POST');

  const { user } = await userSession(request);

  // TODO lock down to admins

  const data: any = await request.json();
  const haikudle = data.haikudle;

  console.log('>> app.api.haikus.POST', { haikudle });
  
  // TODO figure out how to create the haikudle
  
  const created = await createHaikudle(user, data.haikudle);
  return NextResponse.json({ haikudle: created });
}
