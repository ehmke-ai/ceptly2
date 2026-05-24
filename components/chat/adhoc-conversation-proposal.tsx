"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdhocConversationProposal } from "@/lib/api/types";

interface AdhocConversationProposalCardProps {
  proposal: AdhocConversationProposal;
  onStart: () => void;
  pending?: boolean;
  disabled?: boolean;
}

function intentLabel(intent: AdhocConversationProposal["intent"]): string {
  return intent === "gather" ? "Gather information" : "Teach / inform";
}

function intentDescription(intent: AdhocConversationProposal["intent"]): string {
  if (intent === "inform") {
    return "Ceptly will explain the topic in Slack and keep going until the IC understands.";
  }
  return "Ceptly will ask follow-ups in Slack until the information is clear enough.";
}

export function AdhocConversationProposalCard({
  proposal,
  onStart,
  pending = false,
  disabled = false,
}: AdhocConversationProposalCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/20">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Reach out in Slack</h3>
          <p className="mt-1 text-sm text-muted-foreground">{proposal.summary}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Who will be messaged
          </p>
          <div className="flex flex-wrap gap-2">
            {proposal.members.map((member) => (
              <Badge key={member.id} variant="secondary">
                {member.display_name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Conversation type
          </p>
          <Badge variant="outline">{intentLabel(proposal.intent)}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Topic
          </p>
          <p className="text-sm">{proposal.topic}</p>
          {proposal.intent === "inform" && proposal.delivery_facts ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What Ceptly will share
              </p>
              <p className="mt-1 text-sm">{proposal.delivery_facts}</p>
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {intentDescription(proposal.intent)}
          </p>
        </div>

        <Button onClick={onStart} disabled={disabled || pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Starting…
            </>
          ) : (
            "Start conversation"
          )}
        </Button>
      </div>
    </div>
  );
}
