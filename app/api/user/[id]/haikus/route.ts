import { NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { createUserHaiku, getUserHaiku } from '@/services/haikus';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.user.[id].haikus.POST', { request, id: params.id });

  const { user } = await userSession(request);
  const { haiku, action } = await request.json();
  let userHaiku = await getUserHaiku(user.id, haiku.id);

  if (!userHaiku) {
    userHaiku = await createUserHaiku(user, haiku, action);
  } else {
    // TODO update or don't update?
  }

  return NextResponse.json({ userHaiku });
}
