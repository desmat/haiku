import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, generateHaiku, getUserHaikus } from '@/services/haikus';
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';
import { getDailyHaikudles } from '@/services/haikudles';
import { userUsage } from '@/services/usage';
import { DailyHaikudle } from '@/types/Haikudle';
import { USAGE_LIMIT } from '@/types/Usage';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
  const { user } = await userSession(request);
  console.log('>> app.api.haikus.GET', { query, searchParams: request.nextUrl.searchParams.toString(), user });

  if (query.mode != process.env.EXPERIENCE_MODE && !user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  if (query.random) {
    const mode = query.mode;

    if (mode != "haiku" && !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    delete query.mode;
    delete query.random;
    if (!query.lang) {
      query.lang = "en";
    }
    const haikus = await getHaikus(query, mode == "haikudle");
    const random = haikus[Math.floor(Math.random() * haikus.length)];

    const dailyHaikudles = await getDailyHaikudles();
    const dailyHaikudle = dailyHaikudles
      .filter((dailyHaikudles: DailyHaikudle) => dailyHaikudles.haikuId == random.id)[0];
    // console.log('>> app.api.haikus.GET', { dailyHaikudles, dailyHaikudle });

    if (dailyHaikudle) {
      random.dailyHaikudleId = dailyHaikudle?.id;
    }

    return NextResponse.json({ haikus: [random] });
  }

  if (query.mine) {
    const haikus = await getUserHaikus(user);

    if (user.isAdmin) {
      const dailyHaikudles = await getDailyHaikudles();
      return NextResponse.json({ haikus, dailyHaikudles });
    }
    
    return NextResponse.json({ haikus });
  }

  const haikus = await getHaikus(query, process.env.EXPERIENCE_MODE == "haikudle");
  return NextResponse.json({ haikus });
}

export async function POST(request: Request) {
  console.log('>> app.api.haiku.POST', {});

  const data: any = await request.json();
  let { subject, lang } = data.request;
  let mood;
  if (subject.indexOf(",") > -1) {
    const split = subject.split(",");
    subject = split[0];
    mood = split[1];
  }
  console.log('>> app.api.haiku.POST', { lang, subject, mood });

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    const { haikusCreated } = await userUsage(user);

    if (haikusCreated && haikusCreated >= USAGE_LIMIT.DAILY_CREATE_HAIKU) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    }
  }

  const updatedHaiku = await generateHaiku(user, lang, subject, mood);

  return NextResponse.json({ haiku: updatedHaiku });
}
