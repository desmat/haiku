import { NextResponse } from 'next/server'
import { createToken, loadUser, saveUser, userSession } from '@/services/users';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('>> app.api.user.[id].PUT', { params });

  const [
    { user: sessionUser },
    { user: requestUser },
    databaseUser,
  ] = await Promise.all([
    userSession(request),
    request.json(),
    loadUser(params.id),
  ]);

  console.log('>> app.api.user.[id].PUT', { sessionUser, requestUser, databaseUser });

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  if (!requestUser) {
    return NextResponse.json(
      { success: false, message: 'data not provided' },
      { status: 400 }
    );
  }

  // Allow users to only have their sessions locally for now
  // if (!userFromDatabase) {
  //   return NextResponse.json(
  //     { success: false, message: 'not found' },
  //     { status: 404 }
  //   );
  // }

  // guard admin and anonymous flags
  requestUser.isAdmin = databaseUser?.isAdmin || ((process.env.ADMIN_USER_IDS || "").split(",").includes(params.id));
  requestUser.isAnonymous = databaseUser?.isAnonymous || true;

  const savedUser = await saveUser(requestUser);
  const token = await createToken(savedUser);

  return NextResponse.json({ user: savedUser, token });
}
