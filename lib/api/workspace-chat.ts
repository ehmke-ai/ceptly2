import { resolveApiBaseUrl } from "./auth";
import type {
  ChatAgentId,
  ConversationSetupPlan,
  SetupChatMessage,
  SetupChatUiComponent,
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

export async function chatWorkspace(
  accessToken: string,
  workspaceId: string,
  messages: SetupChatMessage[],
  agent?: ChatAgentId,
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    assistant_message: string;
    agent: ChatAgentId;
    proposal: ConversationSetupPlan | null;
    ui_component: SetupChatUiComponent | null;
  };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/chat`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ messages, agent }),
      },
    );
    return parseJsonResponse<{
      data?: {
        assistant_message: string;
        agent: ChatAgentId;
        proposal: ConversationSetupPlan | null;
        ui_component: SetupChatUiComponent | null;
      };
    }>(response);
  } catch {
    return { success: false, error: "Could not reach the API. Is the backend running?" };
  }
}
