import { NextRequest, NextResponse } from 'next/server'
import { getHaiku, deleteHaiku, saveHaiku, getUserHaiku, createUserHaiku, getNextDailyHaikuId, getDailyHaikus } from '@/services/haikus';
import { deleteHaikudle, getDailyHaikudles, getHaikudle, getUserHaikudle } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { DailyHaikudle, Haikudle } from '@/types/Haikudle';
import { searchParamsToMap } from '@/utils/misc';
import { DailyHaiku } from '@/types/Haiku';

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
  const { user } = await userSession(request);
  console.log('>> app.api.haiku.[id].GET', { params });

  if (!["showcase", "social-img", "haikudle-social-img"].includes(query.mode) && query.mode != process.env.EXPERIENCE_MODE && !user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const [haiku, userHaiku, userHaikudle] = await Promise.all([
    getHaiku(user, params.id, query.mode == "haikudle", query.version),
    getUserHaiku(user.id, params.id),
    getUserHaikudle(user?.id, params.id),
  ]);

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  if (user.isAdmin) {
    // TODO: there's a bit of inconsistent redundancy: we sometimes add dailyHaikudleId when a daily is created...
    const [dailyHaikus, dailyHaikudles] = await Promise.all([
      await getDailyHaikus(),
      await getDailyHaikudles(),
    ]);

    haiku.dailyHaikuId = dailyHaikus
      .filter((dh: DailyHaiku) => dh?.haikuId == haiku.id)[0]?.id;

    haiku.dailyHaikudleId = dailyHaikudles
      .filter((dhle: DailyHaikudle) => dhle?.haikuId == haiku.id)[0]?.id;
  }

  if (!user.isAdmin && haiku?.createdBy != user.id && !userHaiku && !userHaikudle) {
    createUserHaiku(user, haiku);
  }

  console.log('>> app.api.haikus.GET', { haiku, userHaiku });

  return NextResponse.json({ haiku });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.[id].PUT', { params });

  const { user } = await userSession(request)
  const haiku = await getHaiku(user, params.id);

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const data: any = await request.json();
  const { haiku: haikuToSave } = data;

  if (!haikuToSave) {
    return NextResponse.json(
      { success: false, message: 'empty request' },
      { status: 400 }
    );
  }

  if (!haiku?.isDemo && !user.isAdmin && haiku.createdBy != user.id) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  // TODO UNCRIPPLE (note that we're creating haikudles when we should not)
  // const haikudle = await getHaikudle(user, params.id);
  // if (haikudle) {
  //   return NextResponse.json(
  //     { success: false, message: 'haiku has associated haikudle' },
  //     { status: 423 }
  //   );
  // }

  const savedHaiku = await saveHaiku(user, {
    ...haikuToSave,
    isDemo: haiku.isDemo,
  });
  return NextResponse.json({ haiku: savedHaiku });
  // return NextResponse.json({ haiku: haikuToSave });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.DELETE', { params });

  const { user } = await userSession(request)

  if (!params.id) {
    throw `Cannot delete haiku with null id`;
  }

  const [haiku, haikudle] = await Promise.all([
    deleteHaiku(user, params.id),
    getHaikudle(user, params.id)
      .then((haikudle: Haikudle) => haikudle && deleteHaikudle(user, params.id)),
  ]);

  return NextResponse.json({ haiku, haikudle });
}
