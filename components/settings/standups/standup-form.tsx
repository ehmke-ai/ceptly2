"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { saveStandupAction } from "@/actions/standups";
import { AppContextPicker } from "@/components/settings/app-context-picker";
import { ResultDestinationsPicker } from "@/components/settings/result-destinations-picker";
import { RosterMemberPicker } from "@/components/settings/roster-member-picker";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { StandupChannelPicker } from "@/components/settings/standups/standup-channel-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelector } from "@/components/ui/option-selector";
import { Textarea } from "@/components/ui/textarea";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AppContextOption,
  ScheduleFrequency,
  Standup,
  StandupStyle,
} from "@/lib/api/types";
import {
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";
import { ScheduleTimePicker } from "@/components/settings/schedule-time-picker";
import { snapScheduleTimeToInterval } from "@/lib/schedule/interval";
import {
  buildResultDestinations,
  parseResultDestinations,
} from "@/lib/result-destinations";

function defaultContextIntegrations(options: AppContextOption[]): string[] {
  const linear = options.find((item) => item.id === "linear");
  if (linear?.selectable) {
    return ["linear"];
  }
  const jira = options.find((item) => item.id === "jira");
  if (jira?.selectable) {
    return ["jira"];
  }
  return [];
}

function initialContextIntegrations(
  standup: Standup | undefined,
  options: AppContextOption[],
): string[] {
  if (standup?.context_integrations?.length) {
    return standup.context_integrations;
  }
  if (standup) {
    return options.filter((option) => option.selectable).map((option) => option.id);
  }
  return defaultContextIntegrations(options);
}

interface StandupFormProps {
  workspaceId: string;
  workspaceTimezone: string;
  rosterMembers: RosterMember[];
  slackChannels: SlackChannel[];
  appContextOptions: AppContextOption[];
  slackChannelsError?: string | null;
  standup?: Standup;
  onSaved?: (standup: Standup) => void;
  onCancel?: () => void;
}

export function StandupForm({
  workspaceId,
  workspaceTimezone,
  rosterMembers,
  slackChannels,
  appContextOptions,
  slackChannelsError,
  standup,
  onSaved,
  onCancel,
}: StandupFormProps) {
  const [name, setName] = useState(standup?.name ?? "");
  const [slackChannelId, setSlackChannelId] = useState(
    standup?.slack_channel_id ?? slackChannels[0]?.id ?? "",
  );
  const [style, setStyle] = useState<StandupStyle>(standup?.style ?? "broadcast");
  const [customInstructions, setCustomInstructions] = useState(
    standup?.custom_instructions ?? "",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    standup?.members.map((member) => member.roster_member_id) ??
      rosterMembers.filter((member) => !member.paused).map((member) => member.id),
  );
  const [contextIntegrations, setContextIntegrations] = useState<string[]>(() =>
    initialContextIntegrations(standup, appContextOptions),
  );
  const initialDestinations = parseResultDestinations(
    standup?.result_destinations,
  );
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    initialDestinations.channelIds,
  );
  const [selectedRosterDmIds, setSelectedRosterDmIds] = useState<string[]>(
    initialDestinations.rosterDmIds,
  );
  const [timezone, setTimezone] = useState(standup?.timezone ?? workspaceTimezone);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    standup?.frequency ?? "specific_days",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    standup?.days_of_week ?? [1, 2, 3, 4, 5],
  );
  const [timeLocal, setTimeLocal] = useState(
    snapScheduleTimeToInterval(standup?.time_local ?? "09:00"),
  );
  const [enabled, setEnabled] = useState(standup?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const timezoneGroups = useMemo(() => groupTimezonesByRegion(), []);

  const slackChannelsForPicker = useMemo(() => {
    const byId = new Map(slackChannels.map((channel) => [channel.id, channel]));
    for (const destination of standup?.result_destinations ?? []) {
      if (
        destination.type === "slack_channel" &&
        !byId.has(destination.channel_id)
      ) {
        byId.set(destination.channel_id, {
          id: destination.channel_id,
          name: destination.name ?? destination.channel_id,
          is_private: false,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [slackChannels, standup?.result_destinations]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter a standup name.");
      return;
    }
    if (!slackChannelId) {
      setError("Select a Slack channel.");
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError("Select at least one team member.");
      return;
    }
    if (frequency === "specific_days" && daysOfWeek.length === 0) {
      setError("Select at least one day.");
      return;
    }

    startTransition(async () => {
      const result = await saveStandupAction({
        workspaceId,
        standupId: standup?.id,
        body: {
          name: name.trim(),
          slack_channel_id: slackChannelId,
          style,
          custom_instructions: customInstructions.trim(),
          roster_member_ids: selectedMemberIds,
          context_integrations: contextIntegrations,
          result_destinations: buildResultDestinations({
            channelIds: selectedChannelIds,
            channels: slackChannelsForPicker,
            rosterDmIds: selectedRosterDmIds,
          }),
          schedule: {
            timezone,
            frequency,
            days_of_week:
              frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
            time_local: timeLocal,
            enabled,
          },
        },
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.standup) {
        onSaved?.(result.standup);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="standup-name">Name</Label>
        <Input
          id="standup-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Engineering standup"
          disabled={isPending}
        />
      </div>

      <StandupChannelPicker
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
        selectedChannelId={slackChannelId}
        onChange={setSlackChannelId}
        disabled={isPending}
      />

      <RosterMemberPicker
        members={rosterMembers}
        selectedIds={selectedMemberIds}
        onChange={setSelectedMemberIds}
        disabled={isPending}
      />

      <AppContextPicker
        options={appContextOptions}
        selectedIds={contextIntegrations}
        onChange={setContextIntegrations}
        disabled={isPending}
      />

      <ResultDestinationsPicker
        slackChannels={slackChannelsForPicker}
        slackChannelsError={slackChannelsError}
        rosterMembers={rosterMembers}
        selectedChannelIds={selectedChannelIds}
        selectedRosterDmIds={selectedRosterDmIds}
        onChannelIdsChange={setSelectedChannelIds}
        onRosterDmIdsChange={setSelectedRosterDmIds}
        disabled={isPending}
        description="After each standup, Ceptly posts a rollup for this standup only. Pick one or more Slack channels, and optionally DM team members."
        channelsMenuLabel="Channels for this standup"
      />

      <div className="space-y-2">
        <Label>Standup style</Label>
        <OptionSelector
          mode="single"
          value={style}
          onChange={(value) => setStyle(value as StandupStyle)}
          options={[
            {
              value: "broadcast",
              label: "Broadcast",
              description: "Ask all participants in the opening message.",
            },
            {
              value: "sequential",
              label: "Sequential",
              description: "Prompt one participant at a time in the thread.",
            },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="standup-instructions">Custom instructions</Label>
        <Textarea
          id="standup-instructions"
          value={customInstructions}
          onChange={(event) => setCustomInstructions(event.target.value)}
          placeholder="What should Ceptly gather from each participant?"
          rows={4}
          disabled={isPending}
        />
      </div>

      <ScheduleTimePicker
        id="standup-time"
        value={timeLocal}
        onChange={setTimeLocal}
        disabled={isPending}
      />

      <div className="space-y-2">
        <Label>Frequency</Label>
        <OptionSelector
          mode="single"
          value={frequency}
          onChange={(value) => setFrequency(value as ScheduleFrequency)}
          options={[
            { value: "daily", label: "Every day" },
            { value: "specific_days", label: "Specific days" },
          ]}
        />
      </div>

      {frequency === "specific_days" ? (
        <ScheduleDaysPicker
          daysOfWeek={daysOfWeek}
          onChange={setDaysOfWeek}
          disabled={isPending}
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="standup-timezone">Timezone</Label>
        <select
          id="standup-timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {Object.entries(timezoneGroups).map(([region, options]) => (
            <optgroup key={region} label={region}>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
          {!TIMEZONE_OPTIONS.some((option) => option.value === timezone) ? (
            <option value={timezone}>{timezone}</option>
          ) : null}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isPending}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Schedule enabled
      </label>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : standup ? (
            "Save changes"
          ) : (
            "Create standup"
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
