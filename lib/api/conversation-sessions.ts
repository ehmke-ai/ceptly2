import { resolveApiBaseUrl } from "./auth";
import type {
  ConversationRunRespondedMember,
  ConversationSessionSummary,
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

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listConversationSessions(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { sessions: ConversationSessionSummary[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/sessions`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{
      data?: { sessions: ConversationSessionSummary[] };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getConversationSession(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { session: ConversationRunRespondedMember };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/sessions/${sessionId}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{
      data?: { session: ConversationRunRespondedMember };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
