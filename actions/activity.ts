"use server";

import { getWorkspaceActivity } from "@/lib/api/activity";
import type { WorkspaceActivity } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchWorkspaceActivity(input: {
  workspaceId: string;
}): Promise<{ activity: WorkspaceActivity | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { activity: null, error: "You must be signed in." };
  }

  const result = await getWorkspaceActivity(token, input.workspaceId);
  if (!result.success || !result.data?.activity) {
    return {
      activity: null,
      error: result.error ?? "Failed to load activity.",
    };
  }

  return { activity: result.data.activity };
}

export async function fetchActivityAttentionCount(input: {
  workspaceId: string;
}): Promise<number> {
  const result = await fetchWorkspaceActivity(input);
  return result.activity?.attention_count ?? 0;
}
