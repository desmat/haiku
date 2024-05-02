// Adapted from https://thomasstep.com/blog/a-guide-to-using-jwt-in-javascript

import { SignJWT, decodeJwt, importPKCS8 } from "jose";

const algorithm = "RS256"
const privateKeyStr = process.env.AUTH_PRIVATE_KEY || "NO_KEY";
const publicKeyStr = process.env.AUTH_PUBLIC_KEY || "NO_KEY";

export async function encodeJWT(payload: any) {
  // console.log(">> utils.jwt.encode", { payload, privateKeyStr: privateKeyStr.substring(0, 16) });
  const privateKey = await importPKCS8(privateKeyStr, algorithm)

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
  // console.log(">> utils.jwt.encode after new SignJWT")

  return token;
}

export async function decodeJWT(token: string) {
  // console.log(">> utils.jwt.decodeJWT", { token });
  const ret = decodeJwt(token);
  // console.log(ret);

  return ret;
}
