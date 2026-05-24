import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SubscribeClient } from "@/components/subscribe/subscribe-client";
import { requireAuth, setSubscriptionCookies } from "@/lib/auth/server";
import {
  getPrimaryWorkspace,
  userCanManageBilling,
  userNeedsSubscribe,
  workspaceHasActiveSubscription,
} from "@/lib/subscription";

export default async function SubscribePage() {
  const user = await requireAuth();
  await setSubscriptionCookies(user);
  const workspace = getPrimaryWorkspace(user);

  if (!userCanManageBilling(workspace)) {
    redirect("/subscription-required");
  }

  if (workspaceHasActiveSubscription(workspace) && !userNeedsSubscribe(user)) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Suspense fallback={null}>
        <SubscribeClient />
      </Suspense>
    </div>
  );
}
