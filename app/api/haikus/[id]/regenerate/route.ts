import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaiku, regenerateLimerickImage, regenerateLimerickPoem } from '@/services/haikus';
import { userSession } from '@/services/users';
import { userUsage } from '@/services/usage';
import { USAGE_LIMIT } from '@/types/Usage';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('>> app.api.haiku.POST', {});

  let { haiku, part, artStyle }: any = await request.json();
  part = part || "poem";

  console.log('>> app.api.haiku.regenerate.POST', { haiku, part });

  const { user } = await userSession(request);
  let reachedUsageLimit = false; // actually _will_ reach usage limit shortly

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
    console.log('>> app.api.haiku.regenerate.POST', { haikusRegenerated, usage });

    if (haikusRegenerated && haikusRegenerated >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
      return NextResponse.json(
        { success: false, message: 'exceeded daily limit' },
        { status: 429 }
      );
    } else if (haikusRegenerated && haikusRegenerated == USAGE_LIMIT.DAILY_REGENERATE_HAIKU - 1) {
      reachedUsageLimit = true;
    }
  }

  if (!["image", "poem"].includes(part))throw `Regenerate part not supported: ${part}`;

  const updatedHaiku = part == "image"
    ? await regenerateLimerickImage(user, haiku, artStyle)
    : await regenerateLimerickPoem(user, haiku);
      
  return NextResponse.json({ haiku: updatedHaiku, reachedUsageLimit });
}
