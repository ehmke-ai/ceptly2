import { NextResponse } from "next/server";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import type { AuthSessionResponse } from "@/lib/api/types";
import {
  setAuthCookies,
  setOnboardingCompleteCookie,
  setSubscriptionCookies,
} from "@/lib/auth/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth?error=google_auth_failed", request.url),
    );
  }

  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}${AUTH_ENDPOINTS.googleFinish}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );

    const result = (await response.json()) as AuthSessionResponse & {
      data?: {
        redirectPath?: string;
        onboardingCompleted?: boolean;
      };
    };

    if (!response.ok || !result.success || !result.data?.session) {
      const message = encodeURIComponent(
        result.error ?? "google_auth_failed",
      );
      return NextResponse.redirect(new URL(`/auth?error=${message}`, request.url));
    }

    await setAuthCookies(result.data.session);

    if (result.data.user) {
      await setSubscriptionCookies(result.data.user);
    }

    if (result.data.onboardingCompleted) {
      await setOnboardingCompleteCookie(true);
    } else {
      await setOnboardingCompleteCookie(false);
    }

    const redirectPath = result.data.redirectPath ?? "/chat";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/auth?error=google_auth_failed", request.url),
    );
  }
}
