// Adapted from https://thomasstep.com/blog/a-guide-to-using-jwt-in-javascript

// import { SignJWT, decodeJwt, importPKCS8 } from "jose";

const algorithm = "RS256"
const privateKeyStr = process.env.AUTH_PRIVATE_KEY || "NO_KEY";
const publicKeyStr = process.env.AUTH_PUBLIC_KEY || "NO_KEY";

export async function encodeJWT(payload: any) {
  console.log(">> utils.jwt.encodeJWT", { payload, encode: process.env.SESSION_ENCODE });

  if (process.env.SESSION_ENCODE == "btoa") {
    console.warn(">> utils.jwt.encodeJWT ALTERNATIVE ENCODING", { encode: process.env.SESSION_ENCODE });
    // workaround safari 12 issue
    return btoa(JSON.stringify(payload));
  }

  throw 'Encoding not supported: ' + process.env.SESSION_ENCODE;
  
  // this still breaks with a production build

  // const jose = await require("jose");

  // const privateKey = await jose.importPKCS8(privateKeyStr, algorithm)

  // const token = await new jose.SignJWT(payload)
  //   .setProtectedHeader({
  //     typ: 'JWT',
  //     alg: algorithm,
  //   })
  //   .setIssuer('https://haiku.desmat.ca')
  //   // .setSubject('uniqueUserId')
  //   .setAudience('haiku.desmat.ca')
  //   .setExpirationTime('1y')
  //   .setIssuedAt()
  //   .sign(privateKey);
  // // console.log(token);
  // // console.log(">> utils.jwt.encode after new SignJWT")

  // return token;
}

export async function decodeJWT(token: string) {
  console.log(">> utils.jwt.decodeJWT", { token: token, encode: process.env.SESSION_ENCODE });

  if (process.env.SESSION_ENCODE == "btoa") {
    console.warn(">> utils.jwt.decodeJWT ALTERNATIVE DECODING", { encode: process.env.SESSION_ENCODE });
    // workaround safari 12 issue
    return JSON.parse(atob(token));
  }

  throw 'Encoding not supported: ' + process.env.SESSION_ENCODE;

  // this still breaks with a production build

  // const jose = await require("jose");
  // const ret = jose.decodeJwt(token);
  // // console.log(">> utils.jwt.decodeJWT", { ret });

  // return ret;
}
