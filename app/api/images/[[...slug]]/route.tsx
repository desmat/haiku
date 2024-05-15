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

  const formData = await request.formData();
  console.log(">> app.api.images.[[slug]].PUT", { formData });
  
  const parts: File[] = [];
  formData.forEach((part: FormDataEntryValue) => parts.push(part as File));
  console.log(">> app.api.images.[[slug]].PUT", { parts });

  const filename = params.slug.join("/")
  const blob = await put(filename, parts[0], {
    access: 'public',
    addRandomSuffix: false,
  });

  console.log('>> app.api.images.[[slug]].PUT', { blob });

  return NextResponse.json(blob);
}
