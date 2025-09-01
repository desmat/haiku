import { NextRequest, NextResponse } from 'next/server'
import { createToken, loadUser, saveUser, userSession } from '@/services/users';

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  const { user: sessionUser } = await userSession(request);
  console.log('app.api.twitter.media.POST', { sessionUser });

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  const mediaUrl = request.nextUrl.searchParams.get("mediaUrl");

  if (!mediaUrl) {
    return NextResponse.json(
      { success: false, message: 'missing required parameter: mediaUrl' },
      { status: 400 }
    );
  }

  const imageRes = await fetch(mediaUrl || "");

  if (!imageRes) {
    return NextResponse.json(
      { success: false, message: 'unable to pull image from mediaUrl' },
      { status: 400 }
    );
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  console.log("app.api.twitter.media.POST", { imageBuffer });

  const imageBlob = new Blob([imageBuffer], { type: "image/png" })

  const formData = new FormData()
  formData.append("media", imageBlob, "image.png");
  
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

  console.log("app.api.twitter.media.POST", { 
    consumer_key: process.env.TWITTER_CONSUMER_KEY, 
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    token_key: process.env.TWITTER_ACCESS_TOKEN,
    token_secret: process.env.TWITTER_TOKEN_SECRET,
   });

  const requestData = {
    url: 'https://upload.twitter.com/1.1/media/upload.json?media_category=tweet_image',
    method: 'POST',
    data: formData,
  }

  const header = oauth.toHeader(oauth.authorize(requestData, token));

  console.log("app.api.twitter.media.POST", { header }); 

  const res = await fetch(requestData.url, {
    headers: {
      ...header,
      "content-type": "multipart/form-data",
    },
    method: requestData.method,
    body: requestData.data,
  });
  console.log('app.api.twitter.media.POST', { res });

  // if (res.status != 200) {
  //   console.error(`Error posting '${requestData.url}': ${res.statusText} (${res.status})`)
  //   return NextResponse.json(res, { status: res.status, statusText: res.statusText });
  // }

  const ret = await res.json();
  console.log('app.api.twitter.media.POST', { data: ret });

  if (!ret.data?.media_id) {
    console.error(`Error posting '${requestData.url}'`, { ret })
    return NextResponse.json(ret);
  }

  return NextResponse.json(ret);

}

