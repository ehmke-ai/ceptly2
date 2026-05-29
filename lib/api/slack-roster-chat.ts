import { resolveApiBaseUrl } from "./auth";

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

export async function updateSlackRosterChatEnabled(
  accessToken: string,
  workspaceId: string,
  rosterChatEnabled: boolean,
): Promise<{
  success: boolean;
  error?: string;
  data?: { roster_chat_enabled: boolean };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/slack/roster-chat`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roster_chat_enabled: rosterChatEnabled }),
      },
    );

    return parseJsonResponse<{ data?: { roster_chat_enabled: boolean } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
