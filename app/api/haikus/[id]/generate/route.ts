import { NextResponse } from 'next/server'
import { getHaiku, generateHaiku } from '@/services/haikus';
import { validateUserSession } from '@/services/users';

export const maxDuration = 300;

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('>> app.api.haiku.[id].generate.POST', { params });

    const { user } = await validateUserSession(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'authentication failed' },
        { status: 401 }
      );
    } 

    // const haiku = await getHaiku(params.id);
    // if (!haiku) {
    //     return NextResponse.json({ haiku: {} }, { status: 404 });
    // }

    const haiku = undefined

    const updatedHaiku = await generateHaiku(user, haiku);
    
    return NextResponse.json({ haiku: updatedHaiku });
}
