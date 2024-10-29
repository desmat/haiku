import { NextResponse } from 'next/server'
import { flagUser, loadUser, userSession } from '@/services/users';

// export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
  console.log(`>> app.api.user.[id].[action].POST`, { params });

  if (["flag"].includes(params.action)) {
    const { user } = await userSession(request);

    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    // const userToFlag = await loadUser(params.id);

    // if (!userToFlag) {
    //   return NextResponse.json({ user: {} }, { status: 404 });
    // }

    // add flag entry even if user record does not exist
    const flaggedUser = await flagUser(user, params.id);
    
    return NextResponse.json({ user: flaggedUser });
  } else {
    return NextResponse.json(
      { success: false, message: 'unsupported action' },
      { status: 400 }
    );
  }
}
