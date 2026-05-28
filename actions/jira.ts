"use server";

import { revalidatePath } from "next/cache";

import { disconnectJira, getJiraInstallUrl } from "@/lib/api/jira";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchJiraInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Jira." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/jira";
  const result = await getJiraInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Jira install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectJiraConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect Jira." };
  }

  const result = await disconnectJira(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect Jira." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/jira");
  revalidatePath("/settings");
  revalidatePath("/chat");

  return { success: true };
}
