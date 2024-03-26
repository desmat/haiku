import { NextRequest, NextResponse } from 'next/server'
import { getHaikus, createHaiku, generateHaiku, regenerateHaikuPoem } from '@/services/haikus';
import { userSession } from '@/services/users';
import { searchParamsToMap } from '@/utils/misc';
import moment from 'moment';
import { Haiku } from '@/types/Haiku';
import { getDailyHaikudles } from '@/services/haikudles';
import { DailyHaikudle } from '@/types/Haikudle';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('>> app.api.haiku.POST', {  });

  const data: any = await request.json();
  const haiku = data.haiku;

  console.log('>> app.api.haiku.regenerate.POST', { haiku });

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    // TODO allow haiku owners but check max regenerated
    
    
    // FOR NOW
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const updatedHaiku = await regenerateHaikuPoem(user, haiku);

  return NextResponse.json({ haiku: updatedHaiku });
}
