import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "./auth";
import type { AuthUser } from "./types";

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

export async function patchUserProfile(
  accessToken: string,
  fullName: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { user: AuthUser };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName }),
    });

    return parseJsonResponse<{ data?: { user: AuthUser } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
