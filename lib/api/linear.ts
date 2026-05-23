import { resolveApiBaseUrl } from "./auth";

export interface LinearConnectionStatus {
  connected: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  connectedAt?: string | null;
}

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

export async function getLinearConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: LinearConnectionStatus;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/linear/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: LinearConnectionStatus }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getLinearInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { url: string };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const params = new URLSearchParams({ return_to: returnTo });
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/linear/install-url?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: { url: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function disconnectLinear(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/linear/disconnect`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<Record<string, never>>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
