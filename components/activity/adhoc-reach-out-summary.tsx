"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdhocReachOutSummaryProps {
  intentLabel: string;
  topic?: string | null;
  deliveryFacts?: string | null;
  compact?: boolean;
}

export function AdhocReachOutSummary({
  intentLabel,
  topic,
  deliveryFacts,
  compact = false,
}: AdhocReachOutSummaryProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {intentLabel}
      </p>
      {topic ? (
        <p className={compact ? "text-sm font-medium" : "text-sm"}>{topic}</p>
      ) : null}
      {deliveryFacts ? (
        compact ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {deliveryFacts}
          </p>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setPromptOpen((open) => !open)}
              aria-expanded={promptOpen}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  promptOpen && "rotate-180",
                )}
              />
              view prompt
            </button>
            {promptOpen ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {deliveryFacts}
              </p>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
