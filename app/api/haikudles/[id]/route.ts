import { NextResponse } from 'next/server'
import { getHaikudle, deleteHaikudle, saveHaikudle } from '@/services/haikudles';
import { userSession } from '@/services/users';
import { getHaiku } from '@/services/haikus';

// TODO I don't think we need this let's remove
// export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haikudle.[id].GET', { params });

  // TODO check user history

  // const haikudle = await getHaikudle(params.id);
  const haiku = await getHaiku(params.id);
  const haikudle = haiku && {
    id: haiku.id,
    haiku,
  }

  if (!haikudle) {
    return NextResponse.json({ haikudle: {} }, { status: 404 });
  }

  return NextResponse.json({ haikudle });
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

  const savedHaikudle = await saveHaikudle(user, haikudle);
  return NextResponse.json({ haikudle: savedHaikudle });
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
