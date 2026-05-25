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

export async function getDigestSlackChannel(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { digest_slack_channel_id: string | null };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/digest-channel`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    return parseJsonResponse<{
      data?: { digest_slack_channel_id: string | null };
    }>(response);
  } catch {
    return { success: false, error: "Could not reach the API. Is the backend running?" };
  }
}

export async function updateDigestSlackChannel(
  accessToken: string,
  workspaceId: string,
  digestSlackChannelId: string | null,
): Promise<{
  success: boolean;
  error?: string;
  data?: { digest_slack_channel_id: string | null };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/digest-channel`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ digest_slack_channel_id: digestSlackChannelId }),
      },
    );
    return parseJsonResponse<{
      data?: { digest_slack_channel_id: string | null };
    }>(response);
  } catch {
    return { success: false, error: "Could not reach the API. Is the backend running?" };
  }
}
