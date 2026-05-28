"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  endTrialAction,
  openBillingPortalAction,
  refreshSubscriptionCookiesAction,
} from "@/actions/billing";
import { SeatManagement } from "@/components/settings/seat-management";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceBillingStatus } from "@/lib/api/billing";
import { formatPricePerSeat } from "@/lib/api/billing";
import { formatSubscriptionStatus } from "@/lib/subscription";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function BillingSettingsClient({
  initialStatus,
  canManage,
  memberCount,
  pendingInviteCount,
  autoOpenManage = false,
}: {
  initialStatus: WorkspaceBillingStatus;
  canManage: boolean;
  memberCount: number;
  pendingInviteCount: number;
  autoOpenManage?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [portalPending, setPortalPending] = useState(false);
  const [endTrialPending, setEndTrialPending] = useState(false);
  const [confirmEndTrial, setConfirmEndTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatPricePerSeat(status.pricePerSeatCents);
  const isTrialing = status.subscriptionStatus === "trialing";

  async function handleManageBilling() {
    setPortalPending(true);
    setError(null);

    try {
      const result = await openBillingPortalAction();
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Unable to open billing portal.");
    } finally {
      setPortalPending(false);
    }
  }

  async function handleEndTrial() {
    if (!isTrialing) {
      return;
    }

    if (!confirmEndTrial) {
      setConfirmEndTrial(true);
      setError(null);
      return;
    }

    setEndTrialPending(true);
    setError(null);

    try {
      const result = await endTrialAction();
      if (result.error) {
        setError(result.error);
        setConfirmEndTrial(false);
        return;
      }

      if (result.data) {
        setStatus(result.data);
      }

      await refreshSubscriptionCookiesAction();
      setConfirmEndTrial(false);
      router.refresh();
    } catch {
      setError("Unable to start paid subscription.");
      setConfirmEndTrial(false);
    } finally {
      setEndTrialPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seats, payment method, invoices, and subscription status.
        </p>
      </div>

      <SeatManagement
        billing={status}
        canManage={canManage}
        memberCount={memberCount}
        pendingInviteCount={pendingInviteCount}
        autoOpenManage={autoOpenManage}
      />

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Per-seat plan at {priceLabel}/month per teammate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {formatSubscriptionStatus(status.subscriptionStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Seats in use</dt>
              <dd className="font-medium">
                {status.seatUsage} of {status.paidSeats}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Price per seat</dt>
              <dd className="font-medium">{priceLabel}/month</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Trial ends</dt>
              <dd className="font-medium">{formatDate(status.trialEndsAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Current period ends
              </dt>
              <dd className="font-medium">
                {formatDate(status.currentPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Cancel at period end
              </dt>
              <dd className="font-medium">
                {status.cancelAtPeriodEnd ? "Yes" : "No"}
              </dd>
            </div>
          </dl>

          {isTrialing && canManage ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to go paid?</p>
                <p className="text-sm text-muted-foreground">
                  End your free trial now and start billing at {priceLabel}
                  /seat/month. Add a payment method first if you haven&apos;t
                  already.
                </p>
              </div>
              {confirmEndTrial ? (
                <Alert>
                  <AlertDescription className="space-y-3">
                    <p>
                      Your card will be charged immediately and seat limits will
                      match your team size.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleEndTrial()}
                        disabled={endTrialPending}
                      >
                        {endTrialPending ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Starting subscription…
                          </>
                        ) : (
                          "Yes, start paid subscription"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmEndTrial(false)}
                        disabled={endTrialPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleEndTrial()}
                  disabled={endTrialPending}
                >
                  Start paid subscription
                </Button>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleManageBilling()}
              disabled={portalPending || !status.hasActiveSubscription}
            >
              {portalPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Opening portal…
                </>
              ) : (
                "Payment method & invoices"
              )}
            </Button>
          </div>

          {!status.hasActiveSubscription ? (
            <p className="text-sm text-muted-foreground">
              No active subscription yet. Go to{" "}
              <a
                href="/subscribe"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Start trial
              </a>{" "}
              to activate your workspace.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
