"use client";

import { ArrowRight, Loader2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdhocConversationProposal } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface AdhocConversationProposalCardProps {
  proposal: AdhocConversationProposal;
  onStart: () => void;
  pending?: boolean;
  disabled?: boolean;
}

function intentEyebrow(intent: AdhocConversationProposal["intent"]): string {
  return intent === "gather" ? "Gather information" : "Teach / inform";
}

function intentFooter(intent: AdhocConversationProposal["intent"]): string {
  if (intent === "inform") {
    return "Goal: Ceptly informs recipients until recipients understand.";
  }
  return "Goal: Message recipients until Ceptly has a clear picture.";
}

function formatMemberNames(
  members: AdhocConversationProposal["members"],
): string {
  return members.map((member) => member.display_name).join(", ");
}

function startButtonLabel(
  members: AdhocConversationProposal["members"],
): string {
  if (members.length === 1) {
    const firstName =
      members[0]!.display_name.split(/\s+/)[0] ?? members[0]!.display_name;
    return `Message ${firstName} in Slack`;
  }
  return "Start conversations in Slack";
}

export function AdhocConversationProposalCard({
  proposal,
  onStart,
  pending = false,
  disabled = false,
}: AdhocConversationProposalCardProps) {
  const recipientNames = formatMemberNames(proposal.members);

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-4",
        "border-[#56FF3C]/30 bg-[#E6F9E6]/70",
        "dark:border-[#56FF3C]/40 dark:bg-[#56FF3C]/10",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquare className="size-3.5 shrink-0" aria-hidden="true" />
        Reach out · Slack DM
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {intentEyebrow(proposal.intent)}
      </p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Recipients: {recipientNames}</span>
      </p>

      <p className="mt-2 text-sm leading-relaxed">{proposal.summary}</p>

      {proposal.intent === "inform" && proposal.delivery_facts ? (
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-medium">Will share:</span>{" "}
          {proposal.delivery_facts}
        </p>
      ) : null}

      <p className="mt-2 text-sm text-muted-foreground">
        {intentFooter(proposal.intent)}
      </p>

      <Button
        className="mt-4 gap-2"
        size="sm"
        onClick={onStart}
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Starting…
          </>
        ) : (
          <>
            {startButtonLabel(proposal.members)}
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}
