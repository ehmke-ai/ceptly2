import { resolveApiBaseUrl } from "./auth";
import type { WorkspaceSchedule } from "./types";

async function parseJsonResponse<T>(response: Response): Promise<T & { success: boolean; error?: string }> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    } as T & { success: boolean; error?: string };
  }

  return (await response.json()) as T & { success: boolean; error?: string };
}

export async function getWorkspaceSchedule(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { schedule: WorkspaceSchedule };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}/schedule`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    return parseJsonResponse<{ data?: { schedule: WorkspaceSchedule } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function putWorkspaceSchedule(
  accessToken: string,
  workspaceId: string,
  schedule: WorkspaceSchedule,
): Promise<{
  success: boolean;
  error?: string;
  data?: { schedule: WorkspaceSchedule };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}/schedule`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    });

    return parseJsonResponse<{ data?: { schedule: WorkspaceSchedule } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function patchWorkspaceName(
  accessToken: string,
  workspaceId: string,
  name: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { workspace: { id: string; name: string; role: string } };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    return parseJsonResponse<{ data?: { workspace: { id: string; name: string; role: string } } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
