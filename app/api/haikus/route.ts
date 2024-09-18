import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server'
import { generateHaiku, getDailyHaiku, getHaiku, getLatestHaikus, createHaiku, getAlbumHaikus, getRandomHaiku, createUserHaiku, getUserHaiku } from '@/services/haikus';
import { userUsage } from '@/services/usage';
import { userSession } from '@/services/users';
import { LanguageType } from '@/types/Languages';
import { USAGE_LIMIT } from '@/types/Usage';
import { searchParamsToMap } from '@/utils/misc';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
  const { user } = await userSession(request);
  console.log('>> app.api.haikus.GET', { query, searchParams: request.nextUrl.searchParams.toString(), user });

  if (query.mode && !["showcase", "social-img", "haikudle-social-img"].includes(query.mode) && query.mode && query.mode != process.env.EXPERIENCE_MODE && !user.isAdmin && !query.album) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  if (query.random) {
    const { mode, flagged, liked, seen } = query;
    const options = {
      flagged: typeof (flagged) == "string" ? flagged == "true" : undefined,
      liked: typeof (liked) == "string" ? liked == "true" : undefined,
      seen: typeof (seen) == "string" ? seen == "true" : undefined,
    };

    if (!["haiku", "showcase", "social-img", "haikudle-social-img"].includes(query.mode) && !user.isAdmin && !query.album) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    delete query.mode;
    delete query.random;
    delete query.flagged;
    delete query.liked;
    delete query.seen;

    // if (!query.lang) {
    //   query.lang = "en";
    // }

    let randomHaiku = await getRandomHaiku(user, mode, query, options);
    if (!randomHaiku) {
      console.warn('>> app.api.haikus.GET: WARNING: Unable to find random haiku');
      return NextResponse.json({ haiku: {} }, { status: 404 });
    }

    const userHaiku = await getUserHaiku(user.id, randomHaiku.id);

    if (/* !user.isAdmin && */ randomHaiku?.createdBy != user.id && !userHaiku) {
      await createUserHaiku(user, randomHaiku);
    }

    return NextResponse.json({ haikus: [randomHaiku] });
  } else if (typeof (query.latest) == "string") {
    const fromDate = moment().add((query.latest || 1) * -1, "days").valueOf();
    const latest = await getLatestHaikus(fromDate);

    return NextResponse.json({ haikus: latest });
  } else if (typeof (query.album) == "string" && query.album) {
    const haikus = await getAlbumHaikus(user, query.album);
    const randomHaiku = haikus[Math.floor(Math.random() * haikus.length)];
    return NextResponse.json({ haikus: [randomHaiku] });
  }

  const todaysDailyHaiku = await getDailyHaiku();
  const todaysHaiku = await getHaiku(user, todaysDailyHaiku?.haikuId || "");
  console.log('>> app.api.haiku.GET', { todaysDailyHaiku, todaysHaiku });

  if (!todaysHaiku) {
    return NextResponse.json({ haiku: {} }, { status: 404 });
  }

  return NextResponse.json({ haikus: [todaysHaiku] });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  console.log('>> app.api.haiku.POST', { contentType });

  let subject: string | undefined;
  let lang: LanguageType | undefined;
  let artStyle: string | undefined;
  let mood: string | undefined;
  let poemString: string | undefined;
  let poem: string[] | undefined;
  let title: string | undefined;
  let imageFile: File | undefined;
  let album: string | undefined;

  if (contentType && contentType.includes("multipart/form-data")) {
    const [formData, { user }] = await Promise.all([
      request.formData(),
      userSession(request),
    ]);

    // only admins can upload their own images
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    title = formData.get("title") as string;
    poemString = formData.get("poem") as string;
    album = formData.get("album") as string;
    imageFile = formData.get("image") as File;

    console.log(">> app.api.haiku.POST", { title, poemString, imageFile });
  } else {
    // assume json
    const data: any = await request.json();
    subject = data.request.subject;
    lang = data.request.lang;
    artStyle = data.request.artStyle;
    album = data.request.album;
    if (subject && subject.indexOf("/") > -1) {
      const split = subject.split("/");
      subject = split[0];
      mood = split[1];
    } else if (subject && subject.indexOf("\n") > -1) {
      poem = subject.split(/\n/).filter(Boolean)
      subject = undefined;
    }
    console.log('>> app.api.haiku.POST', { lang, subject, mood, artStyle, poem, album });
  }

  const { user } = await userSession(request);
  let reachedUsageLimit = false; // actually _will it_ reach usage limit shortly

  if (!user.isAdmin) {
    const usage = await userUsage(user);
    const { haikusCreated } = usage[moment().format("YYYYMMDD")];

    if ((haikusCreated || 0) >= USAGE_LIMIT.DAILY_CREATE_HAIKU) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    } else if ((haikusCreated || 0) + 1 == USAGE_LIMIT.DAILY_CREATE_HAIKU) {
      reachedUsageLimit = true;
    }
  }

  let haiku;
  if (title && poemString && imageFile) {
    // only admins can create specific haikus
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    const poem = poemString.split(/[\n\/]/);
    if (poem?.length != 3) {
      return NextResponse.json(
        { success: false, message: 'haiku poem must have 3 lines' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageType = imageFile.type;

    // @ts-ignore
    haiku = await createHaiku(user, { title, poem, imageBuffer, imageType, albumId: album });
  } else {
    // console.log('>> app.api.haiku.POST generating new haiku', { lang, subject, mood, artStyle });    
    haiku = await generateHaiku(user, { lang, subject, mood, artStyle, poem, albumId: album })
  }

  return NextResponse.json({ haiku, reachedUsageLimit });
}
