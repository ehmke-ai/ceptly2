"use client";

import { Loader2 } from "lucide-react";

import { ConversationIcPreview } from "@/components/settings/conversation-ic-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConversationSetupPlan } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface ConversationSetupProposalProps {
  proposal: ConversationSetupPlan;
  onPublish: () => void;
  publishing: boolean;
  publishError?: string | null;
  publishSuccess?: boolean;
}

export function ConversationSetupProposal({
  proposal,
  onPublish,
  publishing,
  publishError,
  publishSuccess,
}: ConversationSetupProposalProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Proposed schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">{proposal.summary}</p>
      </div>

      <div className="space-y-4">
        {proposal.conversations.map((conversation, index) => {
          const schedulePreview = formatSchedulePreview(
            conversation.schedule.time_local,
            conversation.schedule.timezone,
            conversation.schedule.frequency,
            conversation.schedule.days_of_week,
            conversation.schedule.enabled,
          );
          const previewQuestions = conversation.questions.map(
            (prompt_text, sort_order) => ({
              id: `preview-${index}-${sort_order}`,
              sort_order,
              prompt_text,
              enabled: true,
            }),
          );

          return (
            <Card key={`${conversation.name}-${index}`} className="dark:border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{conversation.name}</CardTitle>
                    {conversation.purpose ? (
                      <CardDescription className="mt-1">
                        {conversation.purpose}
                      </CardDescription>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{schedulePreview}</p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {conversation.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
                <ConversationIcPreview
                  name={conversation.name}
                  questions={previewQuestions}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

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

      <Button onClick={onPublish} disabled={publishing} className="w-full sm:w-auto">
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
