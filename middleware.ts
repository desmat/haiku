// middleware.ts
import moment from "moment";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { saveUser, userSession } from "./services/users";
import { SESSION_TIMEOUT_SECONDS } from "./types/User";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const thing = request.nextUrl.toString();
  // console.log("*** middleware", { path, thing });

  if (path == "/api/user" && method == "POST") {
    // allow new users to create a new session
    return NextResponse.next();
  }

  if (path.startsWith("/api/")) {
    const session = await userSession(request);
    // console.log("*** middleware", { session });

    if (!session?.user) {
      // console.log("*** middleware NOPE", { session });

      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }

    const now = moment();
    const diff = now.diff(session.user?.updatedAt || session.user?.createdAt, "seconds");
    const sessionCount = (session.user?.sessionCount || 1);
    // console.log("*** middleware", { user: session.user, diff, sessionCount });

    await saveUser({ 
      ...session.user, 
      sessionCount: sessionCount + ((diff > SESSION_TIMEOUT_SECONDS) ? 1 : 0)
    });
  }

  return NextResponse.next();
}

// guard all api calls (logic will only look at mutating methods)
export const config = {
  matcher: ['/api/:path*'],
}
