import { NextResponse } from 'next/server'
import { getHaikudle, deleteHaikudle, saveHaikudle, saveUserHaikudle, getUserHaikudle } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { getHaiku } from '@/services/haikus';

// TODO I don't think we need this let's remove
// export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].GET', { params });

  const { user } = await userSession(request);
  // TODO reject?

  const haikudle = await getHaikudle(params.id);
  // console.log('>> app.api.haikudles.GET', { haikudle });

  if (!haikudle) {
    return NextResponse.json({ haikudle: {} }, { status: 404 });
  }

  const userHaikudle = await getUserHaikudle(`${haikudle.haikuId}-${user?.id}`);
  // console.log('>> app.api.haikudles.GET', { userHaikudle, haikudle });

  const haiku = await getHaiku(haikudle?.haikuId);
  // console.log('>> app.api.haikudles.GET', { haiku });

  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  const ret = {
    ...haikudle,
    ...userHaikudle?.haikudle,
    haiku,
  };

  return NextResponse.json({ haikudle: ret });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].PUT', { params });

  const { user } = await userSession(request);

  // TODO check user and shit

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

  // TODO check user and shit

  const haikudle = await deleteHaikudle(user, params.id);
  return NextResponse.json({ haikudle });
}
