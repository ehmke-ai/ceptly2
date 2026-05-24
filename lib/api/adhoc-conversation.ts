import { resolveApiBaseUrl } from "./auth";
import type { AdhocConversationProposal } from "./types";

export const ACTIVE_CHECKIN_IN_PROGRESS_ERROR =
  "That person already has an active check-in in progress.";

async function parseJsonResponse<T>(
  response: Response,
): Promise<T & { success: boolean; error?: string }> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    } as T & { success: boolean; error?: string };
  }

  return (await response.json()) as T & { success: boolean; error?: string };
}

export async function abandonActiveCheckin(
  accessToken: string,
  workspaceId: string,
  rosterMemberIds: string[],
): Promise<{
  success: boolean;
  error?: string;
  data?: { abandoned: number; sessionIds: string[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/adhoc-conversation/abandon`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roster_member_ids: rosterMemberIds }),
      },
    );

    return parseJsonResponse<{
      data?: { abandoned: number; sessionIds: string[] };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function commitAdhocConversation(
  accessToken: string,
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
  success: boolean;
  error?: string;
  data?: {
    sessionsStarted: number;
    conversationIds: string[];
  };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/adhoc-conversation/commit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposal),
      },
    );

    return parseJsonResponse<{
      data?: {
        sessionsStarted: number;
        conversationIds: string[];
      };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
