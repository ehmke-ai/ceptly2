import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const unprotectedPaths = ["/auth", "/onboarding", "/invite"];

function isUnprotected(pathname: string) {
  return unprotectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const onboardingComplete =
    request.cookies.get("onboarding_complete")?.value === "1";
  const isPublic = isUnprotected(pathname);

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (token && pathname.startsWith("/auth")) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (invite) {
      return NextResponse.redirect(new URL(`/invite/${invite}`, request.url));
    }

    return NextResponse.redirect(
      new URL(onboardingComplete ? "/chat" : "/onboarding", request.url),
    );
  }

  if (token && !onboardingComplete && !isPublic) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (token && onboardingComplete && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
