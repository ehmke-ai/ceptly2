import { redirect } from "next/navigation";
import { Suspense } from "react";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { fetchOnboardingStatus } from "@/lib/api/onboarding";
import {
  getAccessToken,
  getCurrentUser,
  setOnboardingCompleteCookie,
} from "@/lib/auth/server";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (user.onboardingCompleted) {
    await setOnboardingCompleteCookie(true);
    redirect("/chat");
  }

  const token = await getAccessToken();
  const status = token ? await fetchOnboardingStatus(token) : null;

  return (
    <Suspense fallback={null}>
      <OnboardingWizard
        user={user}
        initialOrganizationName={
          status?.organizationName ?? user.workspaces?.[0]?.name ?? ""
        }
      />
    </Suspense>
  );
}
