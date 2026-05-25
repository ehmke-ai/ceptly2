"use server";

import { getConversationRun } from "@/lib/api/conversation-results";
import type { ConversationRunDetail } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchConversationRunDetail(input: {
  workspaceId: string;
  conversationId: string;
  runId: string;
}): Promise<{ run: ConversationRunDetail | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { run: null, error: "You must be signed in." };
  }

  const result = await getConversationRun(
    token,
    input.workspaceId,
    input.conversationId,
    input.runId,
  );

  if (!result.success || !result.data?.run) {
    return { run: null, error: result.error ?? "Failed to load run." };
  }

  return { run: result.data.run };
}
