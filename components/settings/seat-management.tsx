"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, Users } from "lucide-react";

import { updateSubscriptionSeatsAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import type { WorkspaceBillingStatus } from "@/lib/api/billing";
import { formatPricePerSeat } from "@/lib/api/billing";
import { cn } from "@/lib/utils";

function formatMonthlyTotal(
  seats: number,
  pricePerSeatCents: number | null | undefined,
): string {
  if (pricePerSeatCents == null) {
    return `${seats} seat${seats === 1 ? "" : "s"}`;
  }
  const total = (seats * pricePerSeatCents) / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);
}

export function SeatManagement({
  billing,
  canManage,
  memberCount,
  pendingInviteCount,
  autoOpenManage = false,
}: {
  billing: WorkspaceBillingStatus | null;
  canManage: boolean;
  memberCount: number;
  pendingInviteCount: number;
  autoOpenManage?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState(billing);
  const [targetSeats, setTargetSeats] = useState(
    Math.max(billing?.paidSeats ?? 0, billing?.seatUsage ?? 0, 1),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(billing);
    if (billing) {
      setTargetSeats(Math.max(billing.paidSeats, billing.seatUsage, 1));
    }
  }, [billing]);

  useEffect(() => {
    if (autoOpenManage && canManage && status?.hasActiveSubscription) {
      dialogRef.current?.showModal();
    }
  }, [autoOpenManage, canManage, status?.hasActiveSubscription]);

  if (!status?.hasActiveSubscription) {
    return null;
  }

  const isTrial = status.subscriptionStatus === "trialing";
  const priceLabel = formatPricePerSeat(status.pricePerSeatCents);
  const minSeats = Math.max(1, status.seatUsage);
  const maxSeats = isTrial ? 1 : undefined;
  const atCapacity = status.seatsAvailable <= 0;
  const usagePercent =
    status.paidSeats > 0
      ? Math.min(100, Math.round((status.seatUsage / status.paidSeats) * 100))
      : 0;
  const seatDelta = targetSeats - status.paidSeats;
  const currentMonthly = formatMonthlyTotal(
    status.paidSeats,
    status.pricePerSeatCents,
  );
  const targetMonthly = formatMonthlyTotal(
    targetSeats,
    status.pricePerSeatCents,
  );

  function openManageDialog() {
    setError(null);
    setTargetSeats(Math.max(status!.paidSeats, status!.seatUsage, 1));
    dialogRef.current?.showModal();
  }

  function closeManageDialog() {
    dialogRef.current?.close();
    setError(null);
  }

  async function handleUpdateSeats() {
    setPending(true);
    setError(null);

    const result = await updateSubscriptionSeatsAction(targetSeats);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setStatus(result.data);
      setTargetSeats(Math.max(result.data.paidSeats, result.data.seatUsage, 1));
    }

    closeManageDialog();
  }

  return (
    <>
      <section
        id="seats"
        className={cn(
          "scroll-mt-6 rounded-lg border border-border bg-muted/20 px-5 py-5 dark:border-white/10",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Seats</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isTrial
                ? "Free trial includes 1 seat. Add more after your trial ends."
                : `Workspace owners and admins use one seat each at ${priceLabel}/month. Members are free.`}
            </p>
          </div>

          {canManage && !isTrial ? (
            <Button
              type="button"
              variant={atCapacity ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={openManageDialog}
            >
              {atCapacity ? "Add seats" : "Manage seats"}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {status.seatUsage} of {status.paidSeats} seats in use
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {status.seatsAvailable} available
            </p>
          </div>
          <Progress value={usagePercent} className="gap-0">
            <ProgressTrack className="h-1.5">
              <ProgressIndicator
                className={cn(atCapacity ? "bg-amber-500" : "bg-primary")}
              />
            </ProgressTrack>
          </Progress>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2.5 dark:border-white/10">
            <dt className="text-xs text-muted-foreground">Billable members</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {memberCount}
            </dd>
          </div>
          <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2.5 dark:border-white/10">
            <dt className="text-xs text-muted-foreground">Billable invites</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {pendingInviteCount}
            </dd>
          </div>
          <div className="rounded-md border border-border/60 bg-background/40 px-3 py-2.5 dark:border-white/10">
            <dt className="text-xs text-muted-foreground">Monthly total</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {currentMonthly}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </dd>
          </div>
        </dl>

        {atCapacity ? (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
            {isTrial
              ? "Your free trial includes 1 seat. When your trial ends, you can add seats to invite more teammates."
              : "All seats are allocated. Add seats to invite more teammates, or revoke a pending invite to free one up."}
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Removing members or revoking invites frees seats. Paid seat count
            syncs on the next billing update (prorated in Stripe).
          </p>
        )}
      </section>

      {canManage && !isTrial ? (
        <dialog
          ref={dialogRef}
          className="fixed top-1/2 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-0 shadow-2xl open:flex open:flex-col [&::backdrop]:bg-black/60"
          onClose={() => setError(null)}
        >
          <form
            method="dialog"
            className="flex flex-col"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Manage seats</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {status.seatUsage} seat{status.seatUsage === 1 ? "" : "s"} in
                use · {priceLabel} each
              </p>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="space-y-3">
                <label
                  htmlFor="team-seat-count"
                  className="text-sm font-medium"
                >
                  Paid seats
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      pending ||
                      targetSeats <= minSeats ||
                      (maxSeats != null && targetSeats <= maxSeats)
                    }
                    onClick={() =>
                      setTargetSeats((value) => Math.max(minSeats, value - 1))
                    }
                    aria-label="Remove seat"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <output
                    id="team-seat-count"
                    htmlFor="team-seat-stepper"
                    className="min-w-12 text-center text-2xl font-semibold tabular-nums"
                  >
                    {targetSeats}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      pending || (maxSeats != null && targetSeats >= maxSeats)
                    }
                    onClick={() => setTargetSeats((value) => value + 1)}
                    aria-label="Add seat"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Minimum {minSeats} seat{minSeats === 1 ? "" : "s"} for current
                  members and invites
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm dark:border-white/10">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Current plan</span>
                  <span className="font-medium tabular-nums">
                    {status.paidSeats} seats · {currentMonthly}/mo
                  </span>
                </div>
                {seatDelta !== 0 ? (
                  <div className="mt-2 flex justify-between gap-4 border-t border-border/60 pt-2 dark:border-white/10">
                    <span className="text-muted-foreground">New plan</span>
                    <span className="font-medium tabular-nums">
                      {targetSeats} seats · {targetMonthly}/mo
                    </span>
                  </div>
                ) : null}
                {seatDelta > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Adding {seatDelta} seat{seatDelta === 1 ? "" : "s"} is
                    prorated for the rest of this billing period.
                  </p>
                ) : null}
                {seatDelta < 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Removing {Math.abs(seatDelta)} seat
                    {Math.abs(seatDelta) === 1 ? "" : "s"} credits your account
                    (prorated).
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={closeManageDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  pending ||
                  targetSeats === status.paidSeats ||
                  targetSeats < minSeats
                }
                onClick={() => void handleUpdateSeats()}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating…
                  </>
                ) : seatDelta > 0 ? (
                  `Add ${seatDelta} seat${seatDelta === 1 ? "" : "s"}`
                ) : seatDelta < 0 ? (
                  `Remove ${Math.abs(seatDelta)} seat${Math.abs(seatDelta) === 1 ? "" : "s"}`
                ) : (
                  "Update seats"
                )}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}
