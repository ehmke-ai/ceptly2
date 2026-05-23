"use client";

import type { ConversationQuestion } from "@/lib/api/types";
import { formatConversationPreviewMessage } from "@/lib/schedule/conversation-preview";

interface ConversationIcPreviewProps {
  name: string;
  questions: ConversationQuestion[];
}

export function ConversationIcPreview({
  name,
  questions,
}: ConversationIcPreviewProps) {
  const message = formatConversationPreviewMessage(name, questions);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-4 py-4 dark:border-white/10">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preview as IC
      </p>
      <div className="space-y-2 text-sm whitespace-pre-wrap">{message}</div>
    </div>
  );
}
