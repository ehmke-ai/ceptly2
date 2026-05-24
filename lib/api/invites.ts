import { resolveApiBaseUrl } from "./auth";
import type { InvitePreview, WorkspaceInvite } from "./types";

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

export async function listInvites(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { invites: WorkspaceInvite[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/invites`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: { invites: WorkspaceInvite[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function createInvite(
  accessToken: string,
  workspaceId: string,
  email: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { invite: WorkspaceInvite };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/invites`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    return parseJsonResponse<{ data?: { invite: WorkspaceInvite } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function revokeInvite(
  accessToken: string,
  workspaceId: string,
  inviteId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/invites/${inviteId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

export async function fetchInvitePreview(token: string): Promise<{
  success: boolean;
  error?: string;
  data?: { preview: InvitePreview };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/invites/${token}`, {
      method: "GET",
      cache: "no-store",
    });

    return parseJsonResponse<{ data?: { preview: InvitePreview } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function acceptInvite(
  accessToken: string,
  token: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { workspace: { id: string; name: string; role: string } };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/invites/${token}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return parseJsonResponse<{
      data?: { workspace: { id: string; name: string; role: string } };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
