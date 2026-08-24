import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Same convention sc-pwa uses on Next 16 (a `proxy.ts` at the project
// root plays the role `middleware.ts` used to). This gates the one
// real route this project has, /dev/seed-workflow-engine, behind login.
const protectedRoutes = ["/dev"];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (request.auth) {
    return NextResponse.next();
  }

  if (isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dev/:path*"],
};
