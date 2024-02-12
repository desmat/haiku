import { NextResponse } from 'next/server'
import { getHaikus, generateHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
import { Haiku } from '@/types/Haiku';
import moment from 'moment';

export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.haiku.[id].generate.POST', { params });

  const data: any = await request.json();
  const haiku = data.haiku;
  console.log('>> app.api.haiku.[id].generate.POST', { haiku });

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    const haikus = await getHaikus({ createdBy: user.id });
    // console.log('>> app.api.haiku.[id].generate.POST', { haikus });

    const createdToday = haikus
      .filter((haiku: Haiku) => moment(haiku.createdAt).isSame(new Date(), "day"))
      .length;
    // console.log('>> app.api.haiku.[id].generate.POST', { createdToday });

    if (createdToday >= 3) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    }
  }

  const updatedHaiku = await generateHaiku(user, haiku.subject, haiku.lang);

  return NextResponse.json({ haiku: updatedHaiku });
}
