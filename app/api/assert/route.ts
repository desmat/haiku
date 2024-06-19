import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';


export async function GET(request: NextRequest, params?: any) {
  const query = searchParamsToMap(request.nextUrl.searchParams.toString()) as any;
  const { user } = await userSession(request);
  console.log('>> app.api.assert.GET', { query, searchParams: request.nextUrl.searchParams.toString(), user });

  return NextResponse.json(
    { success: false, message: 'not implemented' },
    { status: 501 }
  );
}


export async function POST(request: NextRequest) {
  const { user: sessionUser } = await userSession(request);
  console.log('>> app.api.assert.POST', { sessionUser });

  const { regex, data } = await request.json();
  console.log('>> app.api.assert.POST', { regex, data });

  if (!data) {
    throw `Required key 'data' not provided`;
  }

  if (!regex) {
    throw `Required key 'regex' not provided`;
  }

  if (!data.match(regex)) {
    return NextResponse.json(
      { success: false, message: 'assertion failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
