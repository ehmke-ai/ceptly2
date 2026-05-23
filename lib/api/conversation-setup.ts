import { resolveApiBaseUrl } from "./auth";
import type {
  ConversationSetupPlan,
  ScheduledConversation,
  SetupChatMessage,
} from "./types";

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

function authHeaders(accessToken: string, json = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function chatSetup(
  accessToken: string,
  workspaceId: string,
  messages: SetupChatMessage[],
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    assistant_message: string;
    proposal: ConversationSetupPlan | null;
  };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversation-setup/chat`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ messages }),
      },
    );
    return parseJsonResponse<{
      data?: {
        assistant_message: string;
        proposal: ConversationSetupPlan | null;
      };
    }>(response);
  } catch {
    return { success: false, error: "Could not reach the API. Is the backend running?" };
  }
}

export async function commitSetup(
  accessToken: string,
  workspaceId: string,
  plan: ConversationSetupPlan,
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversations: ScheduledConversation[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversation-setup/commit`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(plan),
      },
    );
    return parseJsonResponse<{
      data?: { conversations: ScheduledConversation[] };
    }>(response);
  } catch {
    return { success: false, error: "Could not reach the API. Is the backend running?" };
  }
}
