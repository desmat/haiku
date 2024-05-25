import { NextRequest, NextResponse } from 'next/server'
import { createToken, loadUser, saveUser, userSession } from '@/services/users';

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';


export async function GET(request: NextRequest, params?: any) {
  const { user: sessionUser } = await userSession(request);
  console.log('>> app.api.twitter.oauth1.GET', { sessionUser });

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: 'authorization failed' },
      { status: 403 }
    );
  }

  // THIS WORKS
  /*
  // @ts-ignore
  const oauth = OAuth({
    consumer: {
      key: 'U7RZKRXNwYjVsY8wd3eoCEDzu',
      secret: 'FH4w8TWrKJIScpRh8K7EuHFMfdr0OxpTH3WBz9hSHEmB2CyAy7',
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
    key: '1780677049809580032-hAMKTlqRihDjWT6oW1FlHJnVBvM4d3',
    secret: 'wz1wxxFbpv3QA2HFY1DEPaFxR5OTrEaR8pXX8T9XWheUu',
  }

  const request_data = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
    body: {
      "text": "Hello World!"
    },
  }

  const header = oauth.toHeader(oauth.authorize(request_data, token));

  const res = await fetch(request_data.url, {
    headers: {
      ...header,
      "content-type": "application/json",
    },
    method: request_data.method,
    body: JSON.stringify(request_data.body),
  });
  console.log('>> app.api.twitter.oauth1.GET', { res });

  if (res.status != 200) {
    console.error(`Error posting '${request_data.url}': ${res.statusText} (${res.status})`)
  }

  */






  const imageRes = await fetch("https://iwpybzbnjyjnfzli.public.blob.vercel-storage.com/social_img_haiku/742a87ef.png");

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  console.log(">> app.api.twitter.oauth1.GET", { imageBuffer });

  const imageBlob = new Blob([imageBuffer], { type: "image/png" })

  const formData = new FormData()
  formData.append("media", imageBlob, "image.png");
  

  // @ts-ignore
  const oauth = OAuth({
    consumer: {
      key: 'U7RZKRXNwYjVsY8wd3eoCEDzu',
      secret: 'FH4w8TWrKJIScpRh8K7EuHFMfdr0OxpTH3WBz9hSHEmB2CyAy7',
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
    key: '1780677049809580032-hAMKTlqRihDjWT6oW1FlHJnVBvM4d3',
    secret: 'wz1wxxFbpv3QA2HFY1DEPaFxR5OTrEaR8pXX8T9XWheUu',
  }

  const request_data = {
    url: 'https://upload.twitter.com/1.1/media/upload.json?media_category=tweet_image',
    method: 'POST',
    data: formData,
  }

  const header = oauth.toHeader(oauth.authorize(request_data, token));

  const res = await fetch(request_data.url, {
    headers: {
      ...header,
      // "content-type": "form-data",
    },
    method: request_data.method,
    body: formData,
  });
  console.log('>> app.api.twitter.oauth1.GET', { res });

  if (res.status != 200) {
    console.error(`Error posting '${request_data.url}': ${res.statusText} (${res.status})`)
  }

  const data = await res.json();
  console.log('>> app.api.twitter.oauth1.GET', { data });

  return NextResponse.json({ data });

}