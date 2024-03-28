import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaikudle, deleteHaikudle, saveHaikudle, saveUserHaikudle, getUserHaikudle, createHaikudle, getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { getHaiku } from '@/services/haikus';
import { DailyHaikudle } from '@/types/Haikudle';

// TODO I don't think we need this let's remove
// export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].GET', { params });

  // TODO pull Haikudle and User Haikudle and figure out the rest
  // also, if haikudle was created before today, share as solved?

  const { user } = await userSession(request);
  // TODO reject?

  const todaysDateCode = moment().format("YYYYMMDD");
  const dailyHaikudles = await getDailyHaikudles();
  const dailyHaikudle = dailyHaikudles
    .filter((dh: DailyHaikudle) => dh.id < todaysDateCode && dh.haikudleId == params.id)[0];

  let [haiku, haikudle, nextDailyHaikudleId] = await Promise.all([
    getHaiku(params.id, !dailyHaikudle?.id),
    getHaikudle(params.id),
    getNextDailyHaikudleId(),
  ]);
  // console.log('>> app.api.haikudles.GET', { haiku, haikudle, dailyHaikudle });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  if (!haikudle) {
    haikudle = await createHaikudle(user, {
      id: params.id,
      haikuId: params.id,
      // inProgress: haikudle.inProgress,
    });
  }

  const userHaikudle = await getUserHaikudle(`${haikudle.haikuId}-${user?.id}`);
  // console.log('>> app.api.haikudles.GET', { userHaikudle, haikudle });

  const ret = {
    ...haikudle,
    ...userHaikudle?.haikudle,
    previousDailyHaikudleId: dailyHaikudle?.id,
    haiku,
  };

  return NextResponse.json(
    nextDailyHaikudleId && user.isAdmin
      ? { haikudle: ret, nextDailyHaikudleId }
      : { haikudle: ret }
  );
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].PUT', { params });

  const { user } = await userSession(request);

  // TODO pull Haikudle and User Haikudle and figure out the rest

  const haikudle = await getHaikudle(params.id);

  if (!haikudle) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const data: any = await request.json();

  const savedUserHaikudle = await saveUserHaikudle(user, { ...haikudle, ...data.haikudle });
  return NextResponse.json({ haikudle: savedUserHaikudle.haikudle });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.DELETE', { params });

  const { user } = await userSession(request)

  if (!params.id) {
    throw `Cannot delete haiku with null id`;
  }

  // TODO LOCK DOWN THIS API

  const haikudle = await deleteHaikudle(user, params.id);
  return NextResponse.json({ haikudle });
}
