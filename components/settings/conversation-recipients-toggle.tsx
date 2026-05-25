"use client";

import { useMemo } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RosterMember } from "@/lib/api/roster";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 3;

function recipientLabel(displayName: string): string {
  const trimmed = displayName.trim();
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

interface ConversationRecipientsToggleProps {
  rosterMemberIds?: string[];
  rosterMembers: RosterMember[];
  className?: string;
}

export function ConversationRecipientsToggle({
  rosterMemberIds,
  rosterMembers = [],
  className,
}: ConversationRecipientsToggleProps) {
  const recipients = useMemo(() => {
    const members = rosterMembers ?? [];
    const ids =
      rosterMemberIds && rosterMemberIds.length > 0
        ? rosterMemberIds
        : members.filter((member) => !member.paused).map((member) => member.id);

    const byId = new Map(members.map((member) => [member.id, member]));

    return ids
      .map((id) => byId.get(id))
      .filter((member): member is RosterMember => Boolean(member))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [rosterMemberIds, rosterMembers]);

  if (recipients.length === 0) {
    return null;
  }

  const visible = recipients.slice(0, MAX_VISIBLE);
  const extraCount = recipients.length - visible.length;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <ToggleGroup
        multiple
        disabled
        defaultValue={visible.map((member) => member.id)}
        variant="outline"
        size="sm"
        spacing={2}
        className="max-w-full flex-wrap"
        aria-label="Recipients"
      >
        {visible.map((member) => (
          <ToggleGroupItem key={member.id} value={member.id}>
            {recipientLabel(member.display_name)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {extraCount > 0 ? (
        <span className="text-xs font-medium text-muted-foreground">
          +{extraCount} more
        </span>
      ) : null}
    </div>
  );
}
