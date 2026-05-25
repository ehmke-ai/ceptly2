"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { publishConversationFromTemplate } from "@/actions/create-conversation";
import { AppContextPicker } from "@/components/settings/app-context-picker";
import { RosterMemberPicker } from "@/components/settings/roster-member-picker";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelector } from "@/components/ui/option-selector";
import type { RosterMember } from "@/lib/api/roster";
import type {
  AppContextOption,
  ConversationTemplate,
  ScheduleFrequency,
} from "@/lib/api/types";
import {
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";

function defaultContextIntegrations(
  template: ConversationTemplate | undefined,
  options: AppContextOption[],
): string[] {
  const suggested = template?.suggested_context_integrations ?? [];
  return suggested.filter((id) => {
    const option = options.find((item) => item.id === id);
    return option?.selectable;
  });
}

interface ConversationCreateFormProps {
  workspaceId: string;
  workspaceTimezone: string;
  templates: ConversationTemplate[];
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
}

export function ConversationCreateForm({
  workspaceId,
  workspaceTimezone,
  templates,
  rosterMembers,
  appContextOptions,
}: ConversationCreateFormProps) {
  const dailyStandup =
    templates.find((template) => template.id === "daily_standup") ??
    templates[0];

  const [templateId, setTemplateId] = useState(dailyStandup?.id ?? "");
  const template = templates.find((item) => item.id === templateId) ?? dailyStandup;

  const [name, setName] = useState(template?.name ?? "");
  const [timezone, setTimezone] = useState(workspaceTimezone);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    template?.schedule.frequency ?? "specific_days",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    template?.schedule.days_of_week ?? [1, 2, 3, 4, 5],
  );
  const [timeLocal, setTimeLocal] = useState(
    template?.schedule.time_local ?? "09:00",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    rosterMembers.filter((member) => !member.paused).map((member) => member.id),
  );
  const [contextIntegrations, setContextIntegrations] = useState<string[]>(() =>
    defaultContextIntegrations(dailyStandup, appContextOptions),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const timezoneGroups = useMemo(() => groupTimezonesByRegion(), []);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const next = templates.find((item) => item.id === id);
    if (!next) {
      return;
    }
    setName(next.name);
    setFrequency(next.schedule.frequency);
    setDaysOfWeek(next.schedule.days_of_week);
    setTimeLocal(next.schedule.time_local);
    setContextIntegrations(defaultContextIntegrations(next, appContextOptions));
  };

  const handlePublish = () => {
    if (!template) {
      return;
    }
    setError(null);

    if (selectedMemberIds.length === 0) {
      setError("Select at least one team member.");
      return;
    }

    if (frequency === "specific_days" && daysOfWeek.length === 0) {
      setError("Select at least one day.");
      return;
    }

    startTransition(async () => {
      const result = await publishConversationFromTemplate({
        workspaceId,
        templateId: template.id,
        name: name.trim() || template.name,
        rosterMemberIds: selectedMemberIds,
        contextIntegrations,
        schedule: {
          timezone,
          frequency,
          days_of_week: daysOfWeek,
          time_local: timeLocal,
          enabled: true,
        },
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (!template) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates available.{" "}
        <Link href="/chat" className="underline">
          Use AI setup
        </Link>{" "}
        instead.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Template</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                item.id === templateId
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50 dark:border-white/10"
              }`}
              onClick={() => applyTemplate(item.id)}
            >
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Or{" "}
          <Link href="/chat" className="font-medium underline-offset-4 hover:underline">
            describe your check-ins with AI
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Schedule & team</h2>

        <div className="space-y-2">
          <Label htmlFor="create-name">Name</Label>
          <Input
            id="create-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="create-timezone">Timezone</Label>
          <select
            id="create-timezone"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {!TIMEZONE_OPTIONS.some((option) => option.value === timezone) ? (
              <option value={timezone}>{timezone}</option>
            ) : null}
            {Object.entries(timezoneGroups).map(([region, options]) => (
              <optgroup key={region} label={region}>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Frequency</Label>
          <OptionSelector
            mode="single"
            value={frequency}
            onChange={(value) => setFrequency(value as ScheduleFrequency)}
            options={[
              { value: "daily", label: "Every day" },
              {
                value: "specific_days",
                label: "Specific days",
                description: "Choose which days of the week",
              },
            ]}
          />
        </div>

        {frequency === "specific_days" ? (
          <ScheduleDaysPicker daysOfWeek={daysOfWeek} onChange={setDaysOfWeek} />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="create-time">Time (24h)</Label>
          <Input
            id="create-time"
            value={timeLocal}
            onChange={(event) => setTimeLocal(event.target.value)}
            placeholder="09:00"
          />
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" onClick={handlePublish} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Publishing...
          </>
        ) : (
          "Publish conversation"
        )}
      </Button>
    </div>
  );
}
