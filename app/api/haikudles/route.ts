import { NextRequest, NextResponse } from 'next/server'
import { getHaikudles, createHaikudle, getHaikudle } from '@/services/haikudles';
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

  // const haikudles = await getHaikudles(query);
  // return NextResponse.json({ haikudles });

  const todaysDateCode = moment().format("YYYYMMDD");
  const haikudle = await getHaikudle(todaysDateCode);
  console.log('>> app.api.haikudles.GET', { todaysDateCode, haikudle });

  // const _haikudle = await getHaikudle("83fc071d");
  const haiku = haikudle && await getHaiku(haikudle.haikuId);

  const ret = {
    ...haikudle,
    haiku,
  }

  if (!haikudle) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  return NextResponse.json({ haikudles: [ret] });
}

export async function POST(request: Request) {
  console.log('>> app.api.haikus.POST');

  const { user } = await userSession(request);

  // TODO lock down to admins

  const data: any = await request.json();
  
  // TODO figure out how to create the haikudle
  
  const haikudle = await createHaikudle(user, data.haikudle.haikuId, data.haikudle.id);
  return NextResponse.json({ haikudle });
}
