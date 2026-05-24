import { signOut } from "@/actions/auth";
import { SyncSubscriptionCookies } from "@/components/subscribe/sync-subscription-cookies";
import { requireAuth } from "@/lib/auth/server";
import {
  getPrimaryWorkspace,
  userCanManageBilling,
  workspaceHasActiveSubscription,
} from "@/lib/subscription";
import { redirect } from "next/navigation";

export default async function SubscriptionRequiredPage() {
  const user = await requireAuth();
  const workspace = getPrimaryWorkspace(user);

  if (workspaceHasActiveSubscription(workspace)) {
    redirect("/chat");
  }

  if (userCanManageBilling(workspace)) {
    redirect("/subscribe");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <SyncSubscriptionCookies />
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Workspace subscription required
        </h1>
        <p className="text-muted-foreground">
          {workspace?.name ?? "This workspace"} doesn&apos;t have an active
          Ceptly subscription. Ask your workspace founder or admin to start a
          trial or renew billing.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
