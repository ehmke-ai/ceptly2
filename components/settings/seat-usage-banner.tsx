import Link from "next/link";

import type { WorkspaceBillingStatus } from "@/lib/api/billing";
import { formatPricePerSeat } from "@/lib/api/billing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SeatUsageBanner({
  billing,
  canManageBilling,
}: {
  billing: WorkspaceBillingStatus | null;
  canManageBilling: boolean;
}) {
  if (!billing?.hasActiveSubscription) {
    return null;
  }

  const atCapacity = billing.seatsAvailable <= 0;
  const priceLabel = formatPricePerSeat(billing.pricePerSeatCents);

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        atCapacity
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border bg-muted/20 dark:border-white/10",
      )}
    >
      <p>
        Using <strong>{billing.seatUsage}</strong> of{" "}
        <strong>{billing.paidSeats}</strong> seats
        {billing.pricePerSeatCents != null ? (
          <span className="text-muted-foreground">
            {" "}
            ({priceLabel}/seat/month)
          </span>
        ) : null}
        .
      </p>
      {atCapacity ? (
        <p className="mt-1 text-muted-foreground">
          All seats are allocated to members and pending invites. Add seats to
          invite more teammates.
        </p>
      ) : null}
      {canManageBilling ? (
        <Link
          href="/settings/billing"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
        >
          {atCapacity ? "Add seats" : "Manage billing"}
        </Link>
      ) : null}
    </div>
  );
}
