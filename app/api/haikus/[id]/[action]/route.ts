import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaiku, getUserHaiku, createUserHaiku, saveUserHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
  console.log(`>> app.api.haiku.[id].[action].POST`, { params });

  if (params.action == "like") {
    const [data, { user }] = await Promise.all([
      request.json(),
      userSession(request),
    ]);
    const haiku = await getHaiku(user, params.id);

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const userHaiku =
      (await getUserHaiku(user.id, params.id)) ||
      (await createUserHaiku(user.id, params.id));

    const savedUserHaiku = await saveUserHaiku(user, {
      ...userHaiku,
      likedAt: data.value ? moment().valueOf() : undefined,
    })

    return NextResponse.json({ haiku, userHaiku: savedUserHaiku });
  } else {
    return NextResponse.json(
      { success: false, message: 'unsupported action' },
      { status: 400 }
    );
  }
}
