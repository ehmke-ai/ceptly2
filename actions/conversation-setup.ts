"use server";

import { revalidatePath } from "next/cache";

import { chatSetup, commitSetup } from "@/lib/api/conversation-setup";
import type {
  ConversationSetupPlan,
  ScheduledConversation,
  SetupChatMessage,
  SetupChatUiComponent,
} from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("You must be signed in.");
  }
  return token;
}

export async function sendSetupMessage(
  workspaceId: string,
  messages: SetupChatMessage[],
): Promise<{
  error?: string;
  assistant_message?: string;
  proposal?: ConversationSetupPlan | null;
  ui_component?: SetupChatUiComponent | null;
}> {
  try {
    const token = await requireToken();
    const apiMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));
    const result = await chatSetup(token, workspaceId, apiMessages);

    if (!result.success) {
      return { error: result.error ?? "Failed to send message." };
    }

    return {
      assistant_message: result.data?.assistant_message,
      proposal: result.data?.proposal ?? null,
      ui_component: result.data?.ui_component ?? null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}

export async function commitSetupPlan(
  workspaceId: string,
  plan: ConversationSetupPlan,
): Promise<{
  error?: string;
  conversations?: ScheduledConversation[];
}> {
  try {
    const token = await requireToken();
    const result = await commitSetup(token, workspaceId, plan);

    if (!result.success) {
      return { error: result.error ?? "Failed to publish schedule." };
    }

    revalidatePath("/activity");
    revalidatePath("/settings");

    return { conversations: result.data?.conversations };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to publish schedule.",
    };
  }
}
