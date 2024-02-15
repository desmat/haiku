import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, createHaiku, generateHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';
import moment from 'moment';
import { Haiku } from '@/types/Haiku';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikus.GET', { query, searchParams: request.nextUrl.searchParams.toString() });

  const haikus = await getHaikus(query, process.env.EXPERIENCE_MODE == "haikudle");
  return NextResponse.json({ haikus });
}

export async function POST(request: Request) {
  console.log('>> app.api.haiku.POST', {  });

  const data: any = await request.json();
  const { subject, lang } = data.request;
  console.log('>> app.api.haiku.POST', { subject, lang });

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    const haikus = await getHaikus({ createdBy: user.id });
    // console.log('>> app.api.haiku.POST', { haikus });

    const createdToday = haikus
      .filter((haiku: Haiku) => moment(haiku.createdAt).isSame(new Date(), "day"))
      .length;
    // console.log('>> app.api.haiku.POST', { createdToday });

    if (createdToday >= 3) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    }
  }

  const updatedHaiku = await generateHaiku(user, subject, lang);

  return NextResponse.json({ haiku: updatedHaiku });
}
