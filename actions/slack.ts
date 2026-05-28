"use server";

import { revalidatePath } from "next/cache";

import { disconnectSlack, getSlackInstallUrl } from "@/lib/api/slack";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchSlackInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Slack." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/slack";
  const result = await getSlackInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Slack install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectSlackConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect Slack." };
  }

  const result = await disconnectSlack(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect Slack." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/slack");
  revalidatePath("/settings");
  revalidatePath("/team");

  return { success: true };
}
