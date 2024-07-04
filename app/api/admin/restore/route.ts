import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { restore } from '@/services/admin';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('>> app.api.admin.restore.POST', {});

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  // TODO pull from request param
  const filename = request.nextUrl.searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { success: false, message: 'missing required parameter: filename' },
      { status: 400 }
    );
  }

  const ret = await restore(user, filename);
  console.log('>> app.api.admin.restore.POST', { ret });

  return NextResponse.json(ret);
}
