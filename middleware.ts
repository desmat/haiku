// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { userSession } from "./services/users";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const thing = request.nextUrl.toString();
  console.log("*** middleware", { path, thing });

  if (path.startsWith("/api/")) {
    const session = await userSession(request);
    console.log("*** middleware", { session });

    if (!session?.user) {
      console.log("*** middleware NOPE", { session });

      return NextResponse.json(
        { success: false, message: 'authorization failed' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

// guard all api calls (logic will only look at mutating methods)
export const config = {
  matcher: ['/api/:path*'],
}
