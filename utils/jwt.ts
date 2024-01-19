// Adapted from https://thomasstep.com/blog/a-guide-to-using-jwt-in-javascript

import { SignJWT, decodeJwt, importPKCS8 } from "jose";

const algorithm = "RS256"
const privateKeyStr = process.env.AUTH_PRIVATE_KEY;
const publicKeyStr = process.env.AUTH_PUBLIC_KEY;

export async function encodeJWT(payload: any) {
  // console.log(">> utils.jwt.encode", { secret });

  const privateKey = await importPKCS8(publicKeyStr || "NO_KEY", algorithm)

  const token = await new SignJWT(payload)
    .setProtectedHeader({
      typ: 'JWT',
      alg: algorithm,
    })
    .setIssuer('https://haiku.desmat.ca')
    // .setSubject('uniqueUserId')
    .setAudience('haiku.desmat.ca')
    .setExpirationTime('1y')
    .setIssuedAt()
    .sign(privateKey);
  // console.log(token);

  return token;
}

export async function decodeJWT(token: string) {
  const ret = decodeJwt(token);
  // console.log(ret);

  return ret;
}
