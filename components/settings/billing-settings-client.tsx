"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

import {
  openBillingPortalAction,
  updateSubscriptionSeatsAction,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: {
  initialStatus: WorkspaceBillingStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [portalPending, setPortalPending] = useState(false);
  const [seatsPending, setSeatsPending] = useState(false);
  const [targetSeats, setTargetSeats] = useState(
    Math.max(status.paidSeats, status.seatUsage, 1),
  );
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatPricePerSeat(status.pricePerSeatCents);
  const minSeats = Math.max(1, status.seatUsage);

  async function handleManageBilling() {
    setPortalPending(true);
    setError(null);

    try {
      const result = await openBillingPortalAction();
      if (result?.error) {
        setError(result.error);
        setPortalPending(false);
      }
    } catch {
      setPortalPending(false);
    }
  }

  async function handleUpdateSeats() {
    setSeatsPending(true);
    setError(null);

    const result = await updateSubscriptionSeatsAction(targetSeats);
    setSeatsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStatus((prev) => ({
      ...prev,
      paidSeats: targetSeats,
      seatsAvailable: Math.max(0, targetSeats - prev.seatUsage),
    }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Per-seat subscription for workspace members and pending invites.
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
              <dt className="text-sm text-muted-foreground">Current period ends</dt>
              <dd className="font-medium">
                {formatDate(status.currentPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Cancel at period end</dt>
              <dd className="font-medium">
                {status.cancelAtPeriodEnd ? "Yes" : "No"}
              </dd>
            </div>
          </dl>

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

      {status.hasActiveSubscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Seats</CardTitle>
            <CardDescription>
              Each workspace member and pending invite uses one seat. Removing
              teammates or revoking invites lowers your seat count on the next
              sync (prorated in Stripe).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paid-seats">Paid seats</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={seatsPending || targetSeats <= minSeats}
                  onClick={() =>
                    setTargetSeats((value) => Math.max(minSeats, value - 1))
                  }
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id="paid-seats"
                  type="number"
                  min={minSeats}
                  value={targetSeats}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    if (!Number.isNaN(next)) {
                      setTargetSeats(Math.max(minSeats, next));
                    }
                  }}
                  className="w-24 text-center"
                  disabled={seatsPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={seatsPending}
                  onClick={() => setTargetSeats((value) => value + 1)}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleUpdateSeats()}
                  disabled={seatsPending || targetSeats === status.paidSeats}
                >
                  {seatsPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Update seats"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum {minSeats} seat{minSeats === 1 ? "" : "s"} based on
                current usage.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
