"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateSlackRosterChatEnabled } from "@/lib/api/slack-roster-chat";
import { getAccessToken } from "@/lib/auth/server";

const schema = z.object({
  workspaceId: z.string().uuid(),
  rosterChatEnabled: z.boolean(),
});

export async function updateSlackRosterChatSetting(input: {
  workspaceId: string;
  rosterChatEnabled: boolean;
}): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateSlackRosterChatEnabled(
    token,
    parsed.data.workspaceId,
    parsed.data.rosterChatEnabled,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update Slack setting." };
  }

  revalidatePath("/settings/integrations/slack");
  return {};
}
