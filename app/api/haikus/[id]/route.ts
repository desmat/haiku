import { NextRequest, NextResponse } from 'next/server'
import { getHaiku, deleteHaiku, saveHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';
import { getDailyHaikudles } from '@/services/haikudles';
import { DailyHaikudle } from '@/types/Haikudle';

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
  const { user } = await userSession(request);
  console.log('>> app.api.haiku.[id].GET', { params });

  if (query.mode != process.env.EXPERIENCE_MODE && !user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const haiku = await getHaiku(params.id, query.mode == "haikudle");
  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const dailyHaikudles = await getDailyHaikudles();
  const dailyHaikudle = dailyHaikudles
    .filter((dailyHaikudles: DailyHaikudle) => dailyHaikudles.haikuId == haiku.id)[0];
  // console.log('>> app.api.haikus.GET', { dailyHaikudles, dailyHaikudle });

  if (dailyHaikudle) {
    haiku.dailyHaikudleId = dailyHaikudle?.id;
  }
  // console.log('>> app.api.haikus.GET', { dailyHaikudle });

  if (dailyHaikudle) {
    haiku.dailyHaikudleId = dailyHaikudle?.id;
  }

  return NextResponse.json({ haiku });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.[id].PUT', { params });

  const { user } = await userSession(request)
  const haiku = await getHaiku(params.id);

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const savedHaiku = await saveHaiku(user, haiku);
  return NextResponse.json({ haiku: savedHaiku });
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

  const game = await deleteHaiku(user, params.id);
  return NextResponse.json({ game });
}
