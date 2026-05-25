"use client";

import { fetchConversationRunDetail } from "@/actions/conversation-results";
import { ConversationResultsView } from "@/components/settings/conversation-results-view";
import type {
  ConversationRunDetail,
  ConversationRunSummary,
} from "@/lib/api/types";

interface ConversationResultsClientProps {
  workspaceId: string;
  conversationId: string;
  runs: ConversationRunSummary[];
  initialRun: ConversationRunDetail | null;
}

export function ConversationResultsClient({
  workspaceId,
  conversationId,
  runs,
  initialRun,
}: ConversationResultsClientProps) {
  return (
    <ConversationResultsView
      runs={runs}
      initialRun={initialRun}
      onSelectRun={async (runId) => {
        const result = await fetchConversationRunDetail({
          workspaceId,
          conversationId,
          runId,
        });
        return result.run;
      }}
    />
  );
}
