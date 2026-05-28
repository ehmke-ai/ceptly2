"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";

import { ConversationIcPreview } from "@/components/settings/conversation-ic-preview";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConversationSetupPlan } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface ConversationSetupProposalProps {
  proposal: ConversationSetupPlan;
  onProposalChange: (proposal: ConversationSetupPlan) => void;
  onPublish: () => void;
  publishing: boolean;
  publishError?: string | null;
  publishSuccess?: boolean;
}

function getDisplayEntries(proposal: ConversationSetupPlan) {
  const entries = proposal.conversations
    .map((conversation, index) => ({ conversation, index }))
    .filter(({ conversation }) => !conversation.unchanged_from_existing);

  if (entries.length > 0) {
    return entries;
  }

  return proposal.conversations.map((conversation, index) => ({
    conversation,
    index,
  }));
}

export function ConversationSetupProposal({
  proposal,
  onProposalChange,
  onPublish,
  publishing,
  publishError,
  publishSuccess,
}: ConversationSetupProposalProps) {
  const displayEntries = getDisplayEntries(proposal);
  const daysValidationError = displayEntries.some(
    ({ conversation }) =>
      conversation.schedule.frequency === "specific_days" &&
      conversation.schedule.days_of_week.length === 0,
  );
  const contentValidationError = displayEntries.some(({ conversation }) => {
    if (!conversation.name.trim()) {
      return true;
    }
    if (conversation.questions.length === 0) {
      return true;
    }
    return conversation.questions.some((question) => !question.trim());
  });

  function updateConversation(
    conversationIndex: number,
    patch: Partial<ConversationSetupPlan["conversations"][number]>,
  ) {
    onProposalChange({
      ...proposal,
      conversations: proposal.conversations.map((conversation, index) =>
        index === conversationIndex
          ? { ...conversation, ...patch }
          : conversation,
      ),
    });
  }

  function updateConversationSchedule(
    conversationIndex: number,
    daysOfWeek: number[],
  ) {
    updateConversation(conversationIndex, {
      schedule: {
        ...proposal.conversations[conversationIndex]!.schedule,
        frequency: "specific_days",
        days_of_week: daysOfWeek,
      },
    });
  }

  function updateQuestion(
    conversationIndex: number,
    questionIndex: number,
    promptText: string,
  ) {
    const questions = [...proposal.conversations[conversationIndex]!.questions];
    questions[questionIndex] = promptText;
    updateConversation(conversationIndex, { questions });
  }

  function addQuestion(conversationIndex: number) {
    const questions = [
      ...proposal.conversations[conversationIndex]!.questions,
      "",
    ];
    updateConversation(conversationIndex, { questions });
  }

  function removeQuestion(conversationIndex: number, questionIndex: number) {
    const questions = proposal.conversations[
      conversationIndex
    ]!.questions.filter((_, index) => index !== questionIndex);
    updateConversation(conversationIndex, { questions });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Proposed schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">{proposal.summary}</p>
      </div>

      <div className="space-y-4">
        {displayEntries.map(({ conversation, index }) => {
          const schedulePreview = formatSchedulePreview(
            conversation.schedule.time_local,
            conversation.schedule.timezone,
            conversation.schedule.frequency,
            conversation.schedule.days_of_week,
            conversation.schedule.enabled,
          );
          const previewQuestions = conversation.questions
            .map((prompt_text, sort_order) => ({
              id: `preview-${index}-${sort_order}`,
              sort_order,
              prompt_text: prompt_text.trim(),
              enabled: prompt_text.trim().length > 0,
            }))
            .filter((question) => question.enabled);

          return (
            <Card
              key={`${conversation.name}-${index}`}
              className="dark:border-white/20"
            >
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <Label htmlFor={`proposal-name-${index}`}>Name</Label>
                  <Input
                    id={`proposal-name-${index}`}
                    value={conversation.name}
                    onChange={(event) =>
                      updateConversation(index, { name: event.target.value })
                    }
                    maxLength={100}
                    disabled={publishing || publishSuccess}
                  />
                  {conversation.purpose ? (
                    <CardDescription>{conversation.purpose}</CardDescription>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {schedulePreview}
                </p>
                <ScheduleDaysPicker
                  daysOfWeek={conversation.schedule.days_of_week}
                  onChange={(daysOfWeek) =>
                    updateConversationSchedule(index, daysOfWeek)
                  }
                  disabled={publishing || publishSuccess}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Questions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion(index)}
                      disabled={
                        publishing ||
                        publishSuccess ||
                        conversation.questions.length >= 10
                      }
                    >
                      <Plus className="size-4" />
                      Add question
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {conversation.questions.map((question, questionIndex) => (
                      <div
                        key={`${index}-${questionIndex}`}
                        className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 dark:border-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            Question {questionIndex + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeQuestion(index, questionIndex)}
                            disabled={
                              publishing ||
                              publishSuccess ||
                              conversation.questions.length <= 1
                            }
                            aria-label={`Remove question ${questionIndex + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={question}
                          onChange={(event) =>
                            updateQuestion(
                              index,
                              questionIndex,
                              event.target.value,
                            )
                          }
                          placeholder="What should we ask?"
                          rows={2}
                          maxLength={500}
                          disabled={publishing || publishSuccess}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <ConversationIcPreview
                  name={conversation.name.trim() || "Check-in"}
                  questions={previewQuestions}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {daysValidationError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Select at least one day before publishing.
          </AlertDescription>
        </Alert>
      ) : null}

      {contentValidationError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Add a name and fill in every question before publishing.
          </AlertDescription>
        </Alert>
      ) : null}

      {publishError ? (
        <Alert variant="destructive">
          <AlertDescription>{publishError}</AlertDescription>
        </Alert>
      ) : null}

      {publishSuccess ? (
        <Alert>
          <AlertDescription>
            Schedule published. Your conversations are updated below.
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        onClick={onPublish}
        disabled={
          publishing ||
          publishSuccess ||
          daysValidationError ||
          contentValidationError
        }
        className="w-full sm:w-auto"
      >
        {publishing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Publishing…
          </>
        ) : (
          "Publish schedule"
        )}
      </Button>
    </div>
  );
}
