import moment from 'moment';
import { NextResponse } from 'next/server'
import { regenerateHaikuPoem, getHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';
import { userUsage } from '@/services/usage';
import { USAGE_LIMIT } from '@/types/Usage';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('>> app.api.haiku.POST', {});

  const data: any = await request.json();
  const haiku = data.haiku;

  console.log('>> app.api.haiku.regenerate.POST', { haiku });

  const { user } = await userSession(request);

  if (!user.isAdmin) {
    const h = await getHaiku(user, haiku.id);
    
    // only owners and admins can update
    if (!user.isAdmin && h.createdBy != haiku.createdBy) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );  
    }

    const usage = await userUsage(user);
    const { haikusRegenerated } = usage[moment().format("YYYYMMDD")];

    if (haikusRegenerated && haikusRegenerated >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    }
  }

  const updatedHaiku = await regenerateHaikuPoem(user, haiku);

  return NextResponse.json({ haiku: updatedHaiku });
}
