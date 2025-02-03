import moment from 'moment';
import { NextResponse } from 'next/server'
import { getHaiku, saveUserHaiku, regenerateHaikuImage, regenerateHaikuPoem, updateHaikuImage, likeHaiku, flagHaiku, saveHaiku, getUserHaiku, createUserHaiku, addToAlbum, updateLayout, } from '@/services/haikus';
import { userUsage } from '@/services/usage';
import { userSession } from '@/services/users';
import { triggerHaikuShared } from '@/services/webhooks';
import { USAGE_LIMIT } from '@/types/Usage';

export const maxDuration = 300;
// export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
  console.log(`app.api.haiku.[id].[action].POST`, { params });

  if (["like", "un-like"].includes(params.action)) {
    const { user } = await userSession(request);
    const haiku = await getHaiku(user, params.id);

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const likedHaiku = await likeHaiku(user, haiku, params.action == "like");
    const savedUserHaiku = await saveUserHaiku(user, {
      ...likedHaiku,
      likedAt: params.action == "like"
        ? moment().valueOf()
        : undefined,
    });

    return NextResponse.json({ haiku: await getHaiku(user, params.id) });
  } else if (["flag", "un-flag"].includes(params.action)) {
    const { user } = await userSession(request);
    const haiku = await getHaiku(user, params.id);

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const flaggedHaiku = await flagHaiku(user, haiku, params.action == "flag");
    const savedUserHaiku = await saveUserHaiku(user, {
      ...flaggedHaiku,
      flaggedAt: params.action == "flag"
        ? moment().valueOf()
        : undefined,
    });

    return NextResponse.json({ haiku: await getHaiku(user, params.id) });
  } else if (params.action == "regenerate") {
    let { haiku, part, artStyle, album }: any = await request.json();
    part = part || "poem";

    console.log(`app.api.haiku.[id].[action].POST`, { action: params.action, haiku, part });

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
      console.log('app.api.haiku.regenerate.POST', { haikusRegenerated, usage });

      if ((haikusRegenerated || 0) >= USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
        return NextResponse.json(
          { success: false, message: 'exceeded daily limit' },
          { status: 429 }
        );
      } else if ((haikusRegenerated || 0) + 1 == USAGE_LIMIT.DAILY_REGENERATE_HAIKU) {
        reachedUsageLimit = true;
      }
    }

    if (!["image", "poem"].includes(part)) throw `Regenerate part not supported: ${part}`;

    if (part == "image") delete haiku.shared;

    const updatedHaiku = part == "image"
      ? await regenerateHaikuImage(user, haiku, artStyle, album)
      : await regenerateHaikuPoem(user, haiku, album);

    return NextResponse.json({ haiku: updatedHaiku, reachedUsageLimit });
  } else if (params.action == "updateImage") {
    const [{ value: url }, { user }] = await Promise.all([
      request.json(),
      userSession(request),
    ]);

    // only admins can update the image directly
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'image url not provided' },
        { status: 400 }
      );
    }

    const haiku = await getHaiku(user, params.id);
    console.log(`app.api.haiku.[id].[action].POST`, { action: params.action, url, haiku });

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const imageRet = await fetch(url);
    // console.log("app.api.haiku.[id].[action].POST", { imageRet });  
    const imageBuffer = Buffer.from(await imageRet.arrayBuffer());
    // console.log("app.api.haiku.[id].[action].POST", { imageBuffer });
    const fileExtensionMatch = url.match(/.*(?:\.(jpg|jpeg|gif|png|svg)).*/i);
    // console.log("app.api.haiku.[id].[action].POST", { url, fileExtensionMatch });
    const updatedHaiku = await updateHaikuImage(user, haiku, imageBuffer, fileExtensionMatch ? `image/${fileExtensionMatch[1]}` : undefined);
    console.log(`app.api.haiku.[id].[action].POST`, { updatedHaiku });

    return NextResponse.json({ haiku: updatedHaiku });
  } else if (params.action == "uploadImage") {
    const [formData, { user }] = await Promise.all([
      request.formData(),
      userSession(request),
    ]);

    // only admins can upload their own images
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    // console.log(`app.api.haiku.[id].[action].POST`, { action: params.action, formData });

    const parts: File[] = [];
    formData.forEach((part: FormDataEntryValue) => parts.push(part as File));
    // console.log("app.api.haiku.[id].[action].POST", { parts });

    const haiku = await getHaiku(user, params.id);
    console.log(`app.api.haiku.[id].[action].POST`, { action: params.action, haiku });

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    const imageBuffer = Buffer.from(await parts[0].arrayBuffer());
    const updatedHaiku = await updateHaikuImage(user, haiku, imageBuffer, parts[0].type);
    console.log(`app.api.haiku.[id].[action].POST`, { updatedHaiku });

    return NextResponse.json({ haiku: updatedHaiku });
  } else if (params.action == "share") {
    const { user } = await userSession(request)
    const systemUser = { isAdmin: true, id: "(system)", createdAt: -1 }
    let [haiku, userHaiku] = await Promise.all([
      getHaiku(systemUser, params.id),
      getUserHaiku(user.id, params.id),
    ]);

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    if (!userHaiku) {
      userHaiku = await createUserHaiku(user, haiku);
    }

    if (!userHaiku) {
      throw 'unable to get or create userHaiku';
    }

    await saveUserHaiku(user, { ...userHaiku, sharedAt: moment().valueOf() });

    if (!haiku.sharedVersioned) {
      const ret = await triggerHaikuShared(haiku);
      if (ret) {
        haiku = await saveHaiku(systemUser, {
          ...haiku,
          sharedVersioned: true,
        }, { noVersion: true });
      }
    } else {
      console.log(`app.api.haiku.[id].[action].POST: already shared`, { action: params.action, haiku });
    }

    return NextResponse.json({ haiku });
  } else if (params.action == "updateLayout") {
    const [{ value: album }, { user }] = await Promise.all([
      request.json(),
      userSession(request),
    ]);

    // only admins can update the image directly
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    let haiku = await getHaiku(user, params.id)

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    haiku = await saveHaiku(
      user, 
      await updateLayout(user, haiku),
      { noVersion: true }
    );

    return NextResponse.json({ haiku });
  } else if (params.action == "addToAlbum") {
    const [{ value: album }, { user }] = await Promise.all([
      request.json(),
      userSession(request),
    ]);

    // only admins can update the image directly
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    if (!album) {
      return NextResponse.json(
        { success: false, message: 'image url not provided' },
        { status: 400 }
      );
    }

    let haiku = await getHaiku(user, params.id)

    if (!haiku) {
      return NextResponse.json(
        { success: false, message: 'haiku not found' },
        { status: 404 }
      );
    }

    haiku = await saveHaiku(
      user,
      await addToAlbum(user, haiku, album),
      { noVersion: true });

    return NextResponse.json({ haiku });
  } else {
    return NextResponse.json(
      { success: false, message: 'unsupported action' },
      { status: 400 }
    );
  }
}
