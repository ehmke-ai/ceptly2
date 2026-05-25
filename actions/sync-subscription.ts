"use server";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import type { AuthMeResponse } from "@/lib/api/types";
import {
  getAccessToken,
  setOnboardingCompleteCookie,
  setSubscriptionCookies,
} from "@/lib/auth/server";

async function fetchCurrentUser(token: string) {
  const base = await resolveApiBaseUrl();
  const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as AuthMeResponse;
  return result.data?.user ?? null;
}

export async function refreshSubscriptionCookiesAction(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }

  try {
    const user = await fetchCurrentUser(token);
    if (user) {
      await setSubscriptionCookies(user);
    }
  } catch {
    // Ignore refresh failures; webhook may still be processing.
  }
}

export async function activateAccessAction(options?: {
  syncOnboarding?: boolean;
}): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }

  try {
    const user = await fetchCurrentUser(token);
    if (!user) {
      return;
    }

    await setSubscriptionCookies(user);

    if (options?.syncOnboarding && user.onboardingCompleted) {
      await setOnboardingCompleteCookie(true);
    }
  } catch {
    // Ignore activation failures; user can reload.
  }
}
