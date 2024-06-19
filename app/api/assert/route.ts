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

  const data: any = await request.json();

  return NextResponse.json(data);
}
