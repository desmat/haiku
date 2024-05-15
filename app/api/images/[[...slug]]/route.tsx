import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';
import { put } from '@vercel/blob';

export async function PUT(
  request: NextRequest,
  { params, searchParams }: { params: { slug: any }, searchParams?: { [key: string]: string | undefined }, }
) {
  console.log('>> app.api.images.[[slug]].PUT', { params, searchParams });
  const { user } = await userSession(request);

  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  if (!params.slug?.length) {
    return NextResponse.json(
      { success: false, message: 'filename not provided' },
      { status: 400 }
    );
  }

  const imageBuffer = Buffer.from(await request.arrayBuffer());
  // console.log(">> app.api.images.[[slug]].PUT", { imageBuffer });
  const filename = params.slug.join("/")
  const blob = await put(filename, imageBuffer, {
    access: 'public',
    addRandomSuffix: false,
  });

  console.log('>> app.api.images.[[slug]].PUT', { blob });

  return NextResponse.json(blob);
}
