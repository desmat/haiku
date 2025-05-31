import { NextRequest, NextResponse } from 'next/server'
import { userSession } from '@/services/users';

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { user: sessionUser } = await userSession(request);
  console.log('app.api.twitter.tweet.POST', { sessionUser });

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  // const data: any = await request.json();
  // console.log('app.api.twitter.tweet.POST', { data: JSON.stringify(data) });

  const formData = await request.formData();
  const text = formData.get("text") as string;
  const mediaId = formData.get("media_id") as string;
  console.log('app.api.twitter.tweet.POST', { text, mediaId });

  // throw 'HALT!'

  // @ts-ignore
  const oauth = OAuth({
    consumer: {
      key: process.env.TWITTER_CONSUMER_KEY,
      secret: process.env.TWITTER_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: any, key: any) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64')
    },
  })

  // Note: The token is optional for some requests
  const token = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_TOKEN_SECRET,
  }

  const data = {
    text,
    media: {
      "media_ids:": [mediaId]
    }
  }
  console.log('app.api.twitter.tweet.POST', { data: JSON.stringify(data) });

  const requestData = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
    // data: JSON.stringify(data)
  }

  const header = oauth.toHeader(oauth.authorize(requestData, token));

  const res = await fetch(requestData.url, {
    headers: {
      ...header,
      "content-type": "application/json",
    },
    method: requestData.method,
    body: JSON.stringify(data)
  });
  console.log('app.api.twitter.tweet.POST', { res });

  if (res.status != 200) {
    console.error(`Error posting '${requestData.url}': ${res.statusText} (${res.status})`)
  }

  const ret = await res.json();
  console.log('app.api.twitter.tweet.POST', { ret });

  return NextResponse.json(ret);
}
