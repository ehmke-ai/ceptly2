import { BillingSettingsClient } from "@/components/settings/billing-settings-client";
import { fetchBillingStatus } from "@/lib/api/billing";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { getPrimaryWorkspace } from "@/lib/subscription";
import { redirect } from "next/navigation";

export default async function BillingSettingsPage() {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    redirect("/auth");
  }

  const status = await fetchBillingStatus(token, workspace.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <BillingSettingsClient
        initialStatus={
          status ?? {
            subscriptionStatus: workspace.subscriptionStatus ?? "none",
            trialEndsAt: workspace.trialEndsAt ?? null,
            currentPeriodEnd: workspace.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: workspace.cancelAtPeriodEnd ?? false,
            hasActiveSubscription: workspace.hasActiveSubscription ?? false,
            seatUsage: 0,
            paidSeats: 0,
            seatsAvailable: 0,
            pricePerSeatCents: null,
          }
        }
      />
    </div>
  );
}
