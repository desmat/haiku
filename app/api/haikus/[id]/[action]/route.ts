import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaiku, getUserHaiku, createUserHaiku, saveUserHaiku, regenerateHaikuImage, regenerateHaikuPoem } from '@/services/haikus';
import { userUsage } from '@/services/usage';
import { userSession } from '@/services/users';
import { USAGE_LIMIT } from '@/types/Usage';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
  console.log(`>> app.api.haiku.[id].[action].POST`, { params });

  if (params.action == "like") {
    const [data, { user }] = await Promise.all([
      request.json(),
      userSession(request),
    ]);
    const haiku = await getHaiku(user, params.id);

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const userHaiku =
      (await getUserHaiku(user.id, params.id)) ||
      (await createUserHaiku(user, haiku));

    const savedUserHaiku = await saveUserHaiku(user, {
      ...userHaiku,
      likedAt: data.value ? moment().valueOf() : undefined,
    });

    return NextResponse.json({ haiku, userHaiku: savedUserHaiku });
  } else if (params.action == "regenerate") {
    let { haiku, part, artStyle }: any = await request.json();
    part = part || "poem";
  
    console.log(`>> app.api.haiku.[id].[action].POST`, { action: params.action, haiku, part });

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
  
      if ((haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
        return NextResponse.json(
          { success: false, message: 'exceeded daily limit' },
          { status: 429 }
        );
      } else if ((haikusRegenerated || 0) + 1 == USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
        reachedUsageLimit = true;
      }
    }
  
    if (!["image", "poem"].includes(part))throw `Regenerate part not supported: ${part}`;
  
    const updatedHaiku = part == "image"
      ? await regenerateHaikuImage(user, haiku, artStyle)
      : await regenerateHaikuPoem(user, haiku);
        
    return NextResponse.json({ haiku: updatedHaiku, reachedUsageLimit });
  } else {
    return NextResponse.json(
      { success: false, message: 'unsupported action' },
      { status: 400 }
    );
  }
}
