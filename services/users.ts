import { User } from '@/types/User';
import { decodeJWT } from "@/utils/jwt";

export function getUserName(user: User): string {
  return user?.isAnonymous
    ? "Anonymous"
    : user?.displayName
    || (user?.email && user.email.split("@")?.length > 0 && user.email.split("@")[0])
    || "Noname";
}

export function getProviderType(user: User): string | undefined {
  return "localStorage";
}

  export function getProviderName(user: User): string {
  return user?.isAnonymous
    ? "(anonymous)"
    : "(unknown)";
}

export async function userSession(request: any) {
  // console.log(">> services.users.userSession", { request });
  const authorization = request.headers.get("Authorization");
  // console.log(">> services.users.userSession", { authorization });

  let token;
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.split("Bearer ")[1];
  }

  const decodedToken = token && await decodeJWT(token);
  return decodedToken;
}