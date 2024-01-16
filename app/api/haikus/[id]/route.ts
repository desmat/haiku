import { NextResponse } from 'next/server'
import { getHaiku, deleteHaiku, saveHaiku } from '@/services/haikus';
import { validateUserSession } from '@/services/users';

export const maxDuration = 300;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.[id].GET', { params });

  const haiku = await getHaiku(params.id);
  if (!haiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  return NextResponse.json({ haiku });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.[id].PUT', { params });

  const { user } = await validateUserSession(request)
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    );
  }

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
  const { user } = await validateUserSession(request)
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    );
  }

  if (!params.id) {
    throw `Cannot delete haiku with null id`;
  }

  const game = await deleteHaiku(user, params.id);
  return NextResponse.json({ game });
}
