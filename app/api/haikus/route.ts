import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, createHaiku } from '@/services/haikus';
import { validateUserSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString());
  console.log('>> app.api.haikus.GET', { query, searchParams: request.nextUrl.searchParams.toString() });
  
  const haikus = await getHaikus(query);
  return NextResponse.json({ haikus });
}

export async function POST(request: Request) {
  console.log('>> app.api.haikus.POST');

  const { user } = await validateUserSession(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    );
  }

  const data: any = await request.json();
  const haiku = await createHaiku(user, data.name);
  return NextResponse.json({ haiku });
}