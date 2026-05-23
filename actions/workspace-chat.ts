"use server";

import { chatWorkspace } from "@/lib/api/workspace-chat";
import type {
  ChatAgentId,
  ConversationSetupPlan,
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

export async function sendChatMessage(
  workspaceId: string,
  messages: SetupChatMessage[],
  agent?: ChatAgentId,
): Promise<{
  error?: string;
  assistant_message?: string;
  agent?: ChatAgentId;
  proposal?: ConversationSetupPlan | null;
  ui_component?: SetupChatUiComponent | null;
}> {
  try {
    const token = await requireToken();
    const apiMessages = messages.map(({ role, content }) => ({ role, content }));
    const result = await chatWorkspace(token, workspaceId, apiMessages, agent);

    if (!result.success) {
      return { error: result.error ?? "Failed to send message." };
    }

    return {
      assistant_message: result.data?.assistant_message,
      agent: result.data?.agent,
      proposal: result.data?.proposal ?? null,
      ui_component: result.data?.ui_component ?? null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}
