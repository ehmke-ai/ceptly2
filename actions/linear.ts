"use server";

import { revalidatePath } from "next/cache";

import { disconnectLinear, getLinearInstallUrl } from "@/lib/api/linear";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchLinearInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Linear." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/linear";
  const result = await getLinearInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Linear install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectLinearConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect Linear." };
  }

  const result = await disconnectLinear(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect Linear." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/linear");
  revalidatePath("/settings");
  revalidatePath("/chat");

  return { success: true };
}
