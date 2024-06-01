import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaikudle, deleteHaikudle, saveUserHaikudle, getUserHaikudle, createHaikudle, getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { createUserHaiku, getHaiku, getUserHaiku } from '@/services/haikus';
import { DailyHaikudle } from '@/types/Haikudle';

// TODO I don't think we need this let's remove
// export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].GET', { params });

  const { user } = await userSession(request);

  const todaysDateCode = moment().format("YYYYMMDD");
  const dailyHaikudles = await getDailyHaikudles();
  const dailyHaikudle = dailyHaikudles
    .filter((dh: DailyHaikudle) => dh.id < todaysDateCode && dh.haikudleId == params.id)[0];

  let [
    haiku,
    haikudle,
  ] = await Promise.all([
    getHaiku(user, params.id, !dailyHaikudle?.id),
    getHaikudle(user, params.id),
  ]);
  const myHaiku = undefined; //!user.isAdmin && haiku?.createdBy == user.id && await getHaiku(user, params.id);
  // console.log('>> app.api.haikudles.GET', { haiku, haikudle, dailyHaikudle, myHaiku });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  if (!haikudle) {
    return NextResponse.json({ haikudle: {} }, { status: 404 });
  }

  const userHaikudle = await getUserHaikudle(user?.id, haikudle?.haikuId);

  return NextResponse.json({
    haikudle: {
      ...haikudle,
      ...userHaikudle?.haikudle,
      previousDailyHaikudleId: dailyHaikudle?.id,
      haiku: myHaiku || haiku,
    }
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].PUT', { params });

  const { user } = await userSession(request);

  // TODO pull Haikudle and User Haikudle and figure out the rest

  const haikudle = await getHaikudle(user, params.id);

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

  const haikudle = await deleteHaikudle(user, params.id);
  return NextResponse.json({ haikudle });
}
