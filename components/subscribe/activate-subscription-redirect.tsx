"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { activateAccessAction } from "@/actions/sync-subscription";

type ActivateSubscriptionRedirectProps = {
  syncOnboarding?: boolean;
  redirectTo?: string;
};

export function ActivateSubscriptionRedirect({
  syncOnboarding = false,
  redirectTo = "/chat",
}: ActivateSubscriptionRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await activateAccessAction({ syncOnboarding });
      router.replace(redirectTo);
    })();
  }, [router, redirectTo, syncOnboarding]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <p>Setting up your workspace...</p>
      </div>
    </div>
  );
}
