import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, generateHaiku, getUserHaikus, getUserHaiku, createUserHaiku, getDailyHaiku, getDailyHaikus, createHaiku, saveDailyHaiku, getNextDailyHaikuId, getHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
import { listToMap, mapToList, searchParamsToMap } from '@/utils/misc';
import { getDailyHaikudles, getUserHaikudle } from '@/services/haikudles';
import { userUsage } from '@/services/usage';
import { DailyHaiku, Haiku, UserHaiku } from '@/types/Haiku';
import { DailyHaikudle } from '@/types/Haikudle';
import shuffleArray from '@/utils/shuffleArray';
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

    const [haikus, dailyHaikudles, userHaiku, userHaikudle] = await Promise.all([
      getHaikus(query, mode == "haikudle"),
      getDailyHaikudles(),
      getUserHaiku(user.id, params.id),
      getUserHaikudle(user?.id, params.id),
    ]);

    const randomHaiku = haikus[Math.floor(Math.random() * haikus.length)];
    const dailyHaikudle = dailyHaikudles
      .filter((dailyHaikudles: DailyHaikudle) => dailyHaikudles.haikuId == randomHaiku.id)[0];
    // console.log('>> app.api.haikus.GET', { dailyHaikudles, dailyHaikudle });

    if (dailyHaikudle) {
      randomHaiku.dailyHaikudleId = dailyHaikudle?.id;
    }

    if (!user.isAdmin && randomHaiku?.createdBy != user.id && !userHaiku && !userHaikudle) {
      createUserHaiku(user.id, randomHaiku.id);
    }

    return NextResponse.json({ haikus: [randomHaiku] });
  }

  const todaysDateCode = moment().format("YYYYMMDD");
  let todaysDailyHaiku = await getDailyHaiku(todaysDateCode);
  let todaysHaiku = await getHaiku(user, todaysDailyHaiku?.haikuId || "");
  console.log('>> app.api.haiku.GET', { todaysDateCode, todaysDailyHaiku, todaysHaiku });

  if (!todaysDailyHaiku) {
    // create daily haiku if none for today
    const previousDailyHaikus = await getDailyHaikus();
    const previousDailyHaikuIds = previousDailyHaikus.map((dailyHaiku: DailyHaiku) => dailyHaiku.haikuId);
    const haikus = await getHaikus(query, process.env.EXPERIENCE_MODE == "haikudle");
    const nonDailyhaikus = haikus.filter((haiku: Haiku) => !previousDailyHaikuIds.includes(haiku.id));
    const randomHaikuId = shuffleArray(nonDailyhaikus)[0].id;
    const randomHaiku = haikus[randomHaikuId];
    console.log('>> app.api.haikus.GET creating daily haiku', { randomHaikuId, randomHaiku, previousDailyHaikus, haikus });

    todaysDailyHaiku = await saveDailyHaiku(user, todaysDateCode, randomHaikuId);
    todaysHaiku = haikus.filter((haiku: Haiku) => haiku.id == todaysDailyHaiku?.haikuId)[0];
  }

  if (!todaysHaiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }


  if (user.isAdmin) {
    // TODO: there's a bit of inconsistent redundancy: we sometimes add dailyHaikudleId when a daily is created...
    const [dailyHaikus, dailyHaikudles] = await Promise.all([
      await getDailyHaikus(),
      await getDailyHaikudles(),
    ]);

    todaysHaiku.dailyHaikuId = dailyHaikus
      .filter((dh: DailyHaiku) => dh.haikuId == todaysHaiku.id)[0]?.id;

    todaysHaiku.dailyHaikudleId = dailyHaikudles
      .filter((dhle: DailyHaikudle) => dhle.haikuId == todaysHaiku.id)[0]?.id;
  } else {
    const userHaiku = await getUserHaiku(user.id, todaysHaiku.id);
    if (!userHaiku) {
      // user viewed today's featured haiku for the first
      createUserHaiku(user.id, todaysHaiku.id);
    }
  }

  return NextResponse.json({ haikus: [todaysHaiku] });
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
  let reachedUsageLimit = false; // actually _will_ reach usage limit shortly

  if (!user.isAdmin) {
    const usage = await userUsage(user);
    const { haikusCreated } = usage[moment().format("YYYYMMDD")];

    if (haikusCreated && haikusCreated >= USAGE_LIMIT.DAILY_CREATE_HAIKU) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    } else if (haikusCreated && haikusCreated == USAGE_LIMIT.DAILY_CREATE_HAIKU - 1) {
      reachedUsageLimit = true;
    }
  }

  const updatedHaiku = await generateHaiku(user, lang, subject, mood);

  return NextResponse.json({ haiku: updatedHaiku, reachedUsageLimit });
}
