"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { startBillingCheckoutAction, refreshSubscriptionCookiesAction } from "@/actions/billing";

const included = [
  "Slack conversational check-ins",
  "AI scheduling and team insights chat",
  "One-off Slack reach-out",
  "Linear integration",
  "Per-seat pricing for workspace members",
];

export function SubscribeClient() {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutState === "success") {
      void refreshSubscriptionCookiesAction();
    }
  }, [checkoutState]);

  async function handleStartTrial() {
    setPending(true);
    setError(null);

    try {
      const result = await startBillingCheckoutAction();
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Start your free trial
        </h1>
        <p className="text-muted-foreground">
          Ceptly is $20/seat/month after a 10-day free trial. You are billed for
          each workspace member and pending invite. No credit card required to
          start.
        </p>
        {checkoutState === "success" ? (
          <p className="rounded-lg border border-[#56FF3C]/25 bg-[#E6F9E6]/60 px-4 py-3 text-sm">
            Checkout complete. If access hasn&apos;t unlocked yet, wait a moment
            and refresh.
          </p>
        ) : null}
        {checkoutState === "canceled" ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Checkout canceled. You can start your trial whenever you&apos;re
            ready.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Starter
          </p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">
            $20
            <span className="text-lg font-medium text-muted-foreground">
              /seat/month
            </span>
          </p>
        </div>

        <ul className="mb-6 space-y-3">
          {included.map((item) => (
            <li key={item} className="flex gap-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-[#56FF3C]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void handleStartTrial()}
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Start free trial
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
        {error ? (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
