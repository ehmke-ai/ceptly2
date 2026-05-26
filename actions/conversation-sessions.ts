"use server";

import { getConversationSession } from "@/lib/api/conversation-sessions";
import type { ConversationRunRespondedMember } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchConversationSessionDetail(input: {
  workspaceId: string;
  conversationId: string;
  sessionId: string;
}): Promise<{ session: ConversationRunRespondedMember | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { session: null, error: "You must be signed in." };
  }

  const result = await getConversationSession(
    token,
    input.workspaceId,
    input.conversationId,
    input.sessionId,
  );

  if (!result.success || !result.data?.session) {
    return {
      session: null,
      error: result.error ?? "Failed to load session.",
    };
  }

  return { session: result.data.session };
}
