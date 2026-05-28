"use server";

import {
  abandonConversationSession,
  getConversationSession,
} from "@/lib/api/conversation-sessions";
import type { ConversationRunRespondedMember } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

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

export async function abandonConversationSessionAction(input: {
  workspaceId: string;
  conversationId: string;
  sessionId: string;
}): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await abandonConversationSession(
    token,
    input.workspaceId,
    input.conversationId,
    input.sessionId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to abandon check-in." };
  }

  revalidatePath("/activity");
  revalidatePath(`/activity/${input.conversationId}`);

  return {};
}
