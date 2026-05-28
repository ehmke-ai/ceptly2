"use client";

import { AppContextPicker } from "@/components/settings/app-context-picker";
import { ResultDestinationsPicker } from "@/components/settings/result-destinations-picker";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Badge } from "@/components/ui/badge";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type { AppContextOption, SetupRecapUiComponent } from "@/lib/api/types";

interface SetupRecapPickersProps {
  recap: SetupRecapUiComponent;
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  disabled?: boolean;
  onChange: (recap: SetupRecapUiComponent) => void;
}

export function SetupRecapPickers({
  recap,
  appContextOptions,
  slackChannels,
  slackChannelsError,
  disabled = false,
  onChange,
}: SetupRecapPickersProps) {
  const rosterMembers: RosterMember[] = recap.members.map((member) => ({
    id: member.id,
    display_name: member.display_name,
    email: member.email,
    paused: false,
    slack_user_id: "",
    created_at: "",
    data_sources: [],
    timezone: null,
    language: null,
    effective_timezone: "America/Chicago",
    effective_language: "en",
  }));

  return (
    <div className="w-full space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm dark:border-white/20">
      <ScheduleDaysPicker
        daysOfWeek={recap.days_of_week}
        onChange={(days) => onChange({ ...recap, days_of_week: days })}
        disabled={disabled}
        showLabel
      />

      <div className="space-y-3">
        <p className="text-sm font-medium">Who receives check-in DMs</p>
        <div className="flex flex-col gap-2">
          {recap.members.map((member) => {
            const selected = recap.selected_member_ids.includes(member.id);

            return (
              <button
                key={member.id}
                type="button"
                disabled={disabled}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  const nextIds = selected
                    ? recap.selected_member_ids.filter((id) => id !== member.id)
                    : [...new Set([...recap.selected_member_ids, member.id])];
                  onChange({ ...recap, selected_member_ids: nextIds });
                }}
              >
                <div>
                  <p className="text-sm font-medium">{member.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Badge variant={selected ? "default" : "outline"}>
                  {selected ? "Selected" : "Select"}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <AppContextPicker
        options={appContextOptions}
        selectedIds={recap.selected_context_integrations}
        onChange={(ids) =>
          onChange({ ...recap, selected_context_integrations: ids })
        }
        disabled={disabled}
      />

      <ResultDestinationsPicker
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
        rosterMembers={rosterMembers}
        selectedChannelIds={recap.selected_channel_ids}
        selectedRosterDmIds={recap.selected_roster_dm_ids}
        onChannelIdsChange={(ids) =>
          onChange({ ...recap, selected_channel_ids: ids })
        }
        onRosterDmIdsChange={(ids) =>
          onChange({ ...recap, selected_roster_dm_ids: ids })
        }
        disabled={disabled}
      />
    </div>
  );
}
