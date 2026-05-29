"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type { RosterMember } from "@/lib/api/roster";

interface ResultDestinationsPickerProps {
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  rosterMembers: RosterMember[];
  selectedChannelIds: string[];
  selectedRosterDmIds: string[];
  onChannelIdsChange: (ids: string[]) => void;
  onRosterDmIdsChange: (ids: string[]) => void;
  disabled?: boolean;
  description?: string;
  channelsMenuLabel?: string;
}

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}

function channelLabel(channels: SlackChannel[], selectedIds: string[]): string {
  if (selectedIds.length === 0) {
    return "Select digest channels";
  }
  if (selectedIds.length === 1) {
    const channel = channels.find((item) => item.id === selectedIds[0]);
    return channel ? `#${channel.name}` : "1 channel selected";
  }
  return `${selectedIds.length} channels selected`;
}

export function ResultDestinationsPicker({
  slackChannels,
  slackChannelsError,
  rosterMembers,
  selectedChannelIds,
  selectedRosterDmIds,
  onChannelIdsChange,
  onRosterDmIdsChange,
  disabled = false,
  description = "After each check-in window, Ceptly posts a rollup for this conversation only. Pick one or more Slack channels, and optionally DM team members.",
  channelsMenuLabel = "Channels for this conversation",
}: ResultDestinationsPickerProps) {
  const activeMembers = rosterMembers.filter((member) => !member.paused);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Send standup results to</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="digest-channels-trigger">Digest channels</Label>
        {slackChannelsError ? (
          <p className="text-sm text-destructive">{slackChannelsError}</p>
        ) : slackChannels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No channels found. Invite the Ceptly bot to a channel, then refresh
            this page.
          </p>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              id="digest-channels-trigger"
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                  disabled={disabled}
                />
              }
            >
              <span className="truncate">
                {channelLabel(slackChannels, selectedChannelIds)}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 w-[var(--anchor-width)]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs">
                  {channelsMenuLabel}
                </DropdownMenuLabel>
                {slackChannels.map((channel) => (
                  <DropdownMenuCheckboxItem
                    key={channel.id}
                    checked={selectedChannelIds.includes(channel.id)}
                    onCheckedChange={() =>
                      onChannelIdsChange(
                        toggleId(selectedChannelIds, channel.id),
                      )
                    }
                  >
                    #{channel.name}
                    {channel.is_private ? " (private)" : ""}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {selectedChannelIds.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Rollups post to:{" "}
            {selectedChannelIds
              .map((id) => {
                const channel = slackChannels.find((item) => item.id === id);
                return channel ? `#${channel.name}` : id;
              })
              .join(", ")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">
          Direct messages (optional)
        </Label>
        {activeMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add team members to your roster to DM them standup rollups.
          </p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3 dark:border-white/10">
            {activeMembers.map((member) => {
              const checked = selectedRosterDmIds.includes(member.id);
              return (
                <li key={member.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={disabled}
                      onChange={() =>
                        onRosterDmIdsChange(
                          toggleId(selectedRosterDmIds, member.id),
                        )
                      }
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {member.display_name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        DM rollup
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
