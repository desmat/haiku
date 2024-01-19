import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, createHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
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

  const { user } = await userSession(request);
  const data: any = await request.json();
  const haiku = await createHaiku(user);
  return NextResponse.json({ haiku });
}
