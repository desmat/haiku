import { NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { createUserHaiku, getUserHaiku } from '@/services/haikus';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('app.api.user.[id].haikus.POST', { request, id: params.id });

  const { user } = await userSession(request);
  // Sent on every view: leaving the page mid-request cuts the body off.
  const body = await request.json().catch(() => undefined);
  if (!body?.haiku) {
    return NextResponse.json({ success: false, message: 'invalid request' }, { status: 400 });
  }

  const { haiku, action } = body;
  let userHaiku = await getUserHaiku(user.id, haiku.id);

  if (!userHaiku) {
    userHaiku = await createUserHaiku(user, haiku, action);
  } else {
    // TODO update or don't update?
  }

  return NextResponse.json({ userHaiku });
}
