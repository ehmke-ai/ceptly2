"use server";

import { redirect } from "next/navigation";

import { postOnboardingComplete } from "@/lib/api/onboarding";
import type { OnboardingCompleteInput } from "@/lib/onboarding-schemas";
import {
  getAccessToken,
  setOnboardingCompleteCookie,
  setWorkspaceNameCookie,
} from "@/lib/auth/server";

export type OnboardingActionState = {
  error?: string;
};

export async function completeOnboarding(
  _state: OnboardingActionState,
  payload: OnboardingCompleteInput,
): Promise<OnboardingActionState> {
  const token = await getAccessToken();

  if (!token) {
    redirect("/auth");
  }

  try {
    const result = await postOnboardingComplete(token, payload);

    if (!result.success) {
      return { error: result.error ?? "Failed to complete onboarding." };
    }

    await setOnboardingCompleteCookie(true);
    await setWorkspaceNameCookie(payload.organizationName.trim());
  } catch {
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/chat");
}
