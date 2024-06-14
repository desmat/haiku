import { NextRequest, NextResponse } from 'next/server'
import { createToken, loadUser, saveUser, userSession } from '@/services/users';
import { userUsage } from '@/services/usage';
import { getDailyHaikus, getNextDailyHaikuId, getUserHaikus } from '@/services/haikus';
import { getDailyHaikudles, getNextDailyHaikudleId } from '@/services/haikudles';
import { uuid } from '@/utils/misc';

export async function GET(request: NextRequest, params?: any) {
  const { user: sessionUser } = await userSession(request);
  console.log('>> app.api.user.GET', { sessionUser });

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  let [
    databaseUser,
    usage,
  ] = await Promise.all([
    loadUser(sessionUser.id),
    userUsage(sessionUser),
  ]);

  console.log('>> app.api.user.GET', { sessionUser, databaseUser, usage });

  const user = {
    ...sessionUser,
    ...databaseUser,
  };

  let userHaikus = {
    haikus: user.isAdmin
      ? [] // don't need to pull the admin's haikus because we pull all of them later
      : await getUserHaikus(user),
  } as any;

  if (user.isAdmin) {
    const [
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
    ] = await Promise.all([
      getUserHaikus(user, true),
      getDailyHaikus(),
      getDailyHaikudles(),
    ]);

    const [
      nextDailyHaikuId,
      nextDailyHaikudleId,
    ] = await Promise.all([
      getNextDailyHaikuId(dailyHaikus),
      getNextDailyHaikudleId(dailyHaikudles),
    ]);

    userHaikus = {
      ...userHaikus,
      allHaikus,
      dailyHaikus,
      dailyHaikudles,
      nextDailyHaikuId,
      nextDailyHaikudleId,
    }
  }

  return NextResponse.json({
    user: {
      ...user,
      usage,
    },
    ...userHaikus,
  });
}

export async function POST(
  request: Request,
) {
  console.log('>> app.api.user.POST', {});

  const [
    // { user: userFromSession },
    { user: userFromRequest },
  ] = await Promise.all([
    // userSession(request),
    request.json(),
  ]);

  console.log('>> app.api.user.POST', { userFromRequest });

  // if (userFromSession) {
  //   return NextResponse.json(
  //     { success: false, message: 'user session provided but not expected' },
  //     { status: 400 }
  //   );
  // }

  // NOTE: nothing required from the client side at this time
  // if (!userFromRequest) {
  //   return NextResponse.json(
  //     { success: false, message: 'data not provided' },
  //     { status: 400 }
  //   );
  // }

  if (process.env.ONBOARDING_USER_ID) {
    console.warn('>> app.api.user.POST: CREATING SESSION WITH ONBOARDING USER ID', { onboardingUserId: process.env.ONBOARDING_USER_ID });
  }

  const userId = process.env.ONBOARDING_USER_ID || uuid()
  const newUser = {
    id: userId,
    isAnonymous: true,
    isAdmin: ((process.env.ADMIN_USER_IDS || "").split(",").includes(userId)),
    preferences: {},
    host: request.headers.get("host"),
    referer: request.headers.get("referer"),
  };

  const savedUser = await saveUser(newUser);
  const token = await createToken(savedUser);

  return NextResponse.json({ user: savedUser, token });
}
