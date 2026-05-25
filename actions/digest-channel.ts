"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateDigestSlackChannel } from "@/lib/api/digest-channel";
import { getAccessToken } from "@/lib/auth/server";

const schema = z.object({
  workspaceId: z.string().uuid(),
  digestSlackChannelId: z.string().trim().max(64).nullable(),
});

export async function updateDigestChannel(input: {
  workspaceId: string;
  digestSlackChannelId: string | null;
}): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateDigestSlackChannel(
    token,
    parsed.data.workspaceId,
    parsed.data.digestSlackChannelId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update digest channel." };
  }

  revalidatePath("/settings/integrations/slack");
  return {};
}
