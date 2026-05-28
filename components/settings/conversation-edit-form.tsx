"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { saveConversation } from "@/actions/conversations";
import { AppContextPicker } from "@/components/settings/app-context-picker";
import { ConversationIcPreview } from "@/components/settings/conversation-ic-preview";
import { ResultDestinationsPicker } from "@/components/settings/result-destinations-picker";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelector } from "@/components/ui/option-selector";
import { Textarea } from "@/components/ui/textarea";
import { RosterMemberPicker } from "@/components/settings/roster-member-picker";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AppContextOption,
  ConversationQuestion,
  ConversationResultDestination,
  ScheduleFrequency,
  ScheduledConversation,
} from "@/lib/api/types";
import {
  buildResultDestinations,
  parseResultDestinations,
} from "@/lib/result-destinations";
import { conversationToSchedule } from "@/lib/api/conversations";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import {
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";

type QuestionDraft = {
  key: string;
  id?: string;
  prompt_text: string;
  enabled: boolean;
};

interface ConversationEditFormProps {
  conversation: ScheduledConversation;
  workspaceId: string;
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

function toQuestionDrafts(questions: ConversationQuestion[]): QuestionDraft[] {
  return [...questions]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((question) => ({
      key: question.id,
      id: question.id,
      prompt_text: question.prompt_text,
      enabled: question.enabled,
    }));
}

export function ConversationEditForm({
  conversation,
  workspaceId,
  rosterMembers,
  appContextOptions,
  slackChannels,
  slackChannelsError,
  onCancel,
  onSaved,
}: ConversationEditFormProps) {
  const [name, setName] = useState(conversation.name);
  const [summary, setSummary] = useState(conversation.summary ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    conversation.roster_member_ids?.length
      ? conversation.roster_member_ids
      : rosterMembers
          .filter((member) => !member.paused)
          .map((member) => member.id),
  );
  const [timezone, setTimezone] = useState(conversation.timezone);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    conversation.frequency,
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    conversation.days_of_week,
  );
  const [timeLocal, setTimeLocal] = useState(conversation.time_local);
  const [enabled, setEnabled] = useState(conversation.enabled);
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    toQuestionDrafts(conversation.questions ?? []),
  );
  const [contextIntegrations, setContextIntegrations] = useState<string[]>(
    conversation.context_integrations ?? [],
  );
  const initialDestinations = parseResultDestinations(
    conversation.result_destinations,
  );
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    initialDestinations.channelIds,
  );
  const [selectedRosterDmIds, setSelectedRosterDmIds] = useState<string[]>(
    initialDestinations.rosterDmIds,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const timezoneGroups = useMemo(() => groupTimezonesByRegion(), []);

  const slackChannelsForPicker = useMemo(() => {
    const byId = new Map(slackChannels.map((channel) => [channel.id, channel]));
    for (const destination of conversation.result_destinations ?? []) {
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
  }, [slackChannels, conversation.result_destinations]);
  const hasTimezoneInList = TIMEZONE_OPTIONS.some(
    (option) => option.value === timezone,
  );

  const schedulePreview = formatSchedulePreview(
    timeLocal,
    timezone,
    frequency,
    daysOfWeek,
    enabled,
  );

  const previewQuestions: ConversationQuestion[] = questions.map(
    (question, index) => ({
      id: question.id ?? question.key,
      sort_order: index,
      prompt_text: question.prompt_text,
      enabled: question.enabled,
    }),
  );

  const updateQuestion = (
    key: string,
    patch: Partial<Pick<QuestionDraft, "prompt_text" | "enabled">>,
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, ...patch } : question,
      ),
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        prompt_text: "",
        enabled: true,
      },
    ]);
  };

  const removeQuestion = (key: string) => {
    setQuestions((current) =>
      current.filter((question) => question.key !== key),
    );
  };

  const handleSave = () => {
    setError(null);

    if (questions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    if (questions.some((question) => !question.prompt_text.trim())) {
      setError("Every question needs prompt text.");
      return;
    }

    if (frequency === "specific_days" && daysOfWeek.length === 0) {
      setError("Select at least one day.");
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError("Select at least one team member.");
      return;
    }

    const resultDestinations: ConversationResultDestination[] =
      buildResultDestinations({
        channelIds: selectedChannelIds,
        channels: slackChannelsForPicker,
        rosterDmIds: selectedRosterDmIds,
      });

    startTransition(async () => {
      const result = await saveConversation({
        workspaceId,
        conversationId: conversation.id,
        name: name.trim(),
        summary: summary.trim() || null,
        roster_member_ids: selectedMemberIds,
        context_integrations: contextIntegrations,
        resultDestinations,
        schedule: {
          ...conversationToSchedule(conversation),
          timezone,
          frequency,
          days_of_week: daysOfWeek,
          time_local: timeLocal,
          enabled,
        },
        questions: questions.map((question) => ({
          id: question.id,
          prompt_text: question.prompt_text.trim(),
          enabled: question.enabled,
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onSaved();
    });
  };

  return (
    <div className="space-y-6 border-t pt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`conversation-name-${conversation.id}`}>Name</Label>
          <Input
            id={`conversation-name-${conversation.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`conversation-summary-${conversation.id}`}>
            Summary
          </Label>
          <Textarea
            id={`conversation-summary-${conversation.id}`}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Short description for the conversations list (generated on create; you can edit)"
          />
        </div>

        {conversation.template_id ? (
          <p className="text-sm text-muted-foreground">
            Template: {conversation.template_id.replace(/_/g, " ")}
          </p>
        ) : null}

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
        />

        <div className="space-y-2">
          <Label htmlFor={`conversation-timezone-${conversation.id}`}>
            Timezone
          </Label>
          <select
            id={`conversation-timezone-${conversation.id}`}
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {!hasTimezoneInList ? (
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
          <ScheduleDaysPicker
            daysOfWeek={daysOfWeek}
            onChange={setDaysOfWeek}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`conversation-time-${conversation.id}`}>Time</Label>
            <Input
              id={`conversation-time-${conversation.id}`}
              type="time"
              value={timeLocal}
              onChange={(event) => setTimeLocal(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <OptionSelector
              mode="single"
              value={enabled ? "active" : "paused"}
              onChange={(value) => setEnabled(value === "active")}
              options={[
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
              ]}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{schedulePreview}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label>Questions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
          >
            <Plus className="size-4" />
            Add question
          </Button>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.key}
              className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Question {index + 1}</p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={question.enabled}
                      onChange={(event) =>
                        updateQuestion(question.key, {
                          enabled: event.target.checked,
                        })
                      }
                      className="size-4 rounded border-input"
                    />
                    Enabled
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeQuestion(question.key)}
                    disabled={questions.length <= 1}
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={question.prompt_text}
                onChange={(event) =>
                  updateQuestion(question.key, {
                    prompt_text: event.target.value,
                  })
                }
                placeholder="What should we ask?"
                rows={2}
                maxLength={500}
              />
            </div>
          ))}
        </div>
      </div>

      <ConversationIcPreview
        name={name.trim() || conversation.name}
        questions={previewQuestions}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
