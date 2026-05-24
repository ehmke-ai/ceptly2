"use server";

import {
  abandonActiveCheckin as abandonActiveCheckinApi,
  commitAdhocConversation as commitAdhocConversationApi,
} from "@/lib/api/adhoc-conversation";
import type { AdhocConversationProposal } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("You must be signed in.");
  }
  return token;
}

export async function commitAdhocConversationAction(
  workspaceId: string,
  proposal: Pick<
    AdhocConversationProposal,
    | "roster_member_ids"
    | "intent"
    | "topic"
    | "conversation_name"
    | "delivery_facts"
  >,
): Promise<{
  error?: string;
  sessionsStarted?: number;
}> {
  try {
    const token = await requireToken();
    const result = await commitAdhocConversationApi(
      token,
      workspaceId,
      proposal,
    );

    if (!result.success) {
      return { error: result.error ?? "Failed to start conversation." };
    }

    return {
      sessionsStarted: result.data?.sessionsStarted ?? 0,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to start conversation.",
    };
  }
}

export async function abandonActiveCheckinAction(
  workspaceId: string,
  rosterMemberIds: string[],
): Promise<{
  error?: string;
  abandoned?: number;
}> {
  try {
    const token = await requireToken();
    const result = await abandonActiveCheckinApi(
      token,
      workspaceId,
      rosterMemberIds,
    );

    if (!result.success) {
      return { error: result.error ?? "Failed to end active check-in." };
    }

    return {
      abandoned: result.data?.abandoned ?? 0,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to end active check-in.",
    };
  }
}
