import { NextResponse } from 'next/server'
import { getHaiku, generateHaiku } from '@/services/haikus';
import { userSession } from '@/services/users';

export const maxDuration = 300;

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('>> app.api.haiku.[id].generate.POST', { params });

    const data: any = await request.json();
    const haiku = data.haiku;
    console.log('>> app.api.haiku.[id].generate.POST', { haiku });
  
    const { user } = await userSession(request);
    const updatedHaiku = await generateHaiku(user, haiku.subject, haiku.lang);
    
    return NextResponse.json({ haiku: updatedHaiku });
}
