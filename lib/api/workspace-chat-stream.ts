import type {
  AdhocConversationProposal,
  ChatAgentId,
  ConversationSetupPlan,
  SetupChatMessage,
  SetupChatUiComponent,
} from "./types";

export type ChatIntegrationId = "slack" | "linear" | "ceptly";

export type ChatStreamEvent =
  | { type: "status"; label: string }
  | {
      type: "tool_start";
      id: string;
      integration: ChatIntegrationId;
      name: string;
      args_preview?: string;
    }
  | {
      type: "tool_end";
      id: string;
      status: "success" | "error";
    }
  | { type: "text_delta"; delta: string }
  | {
      type: "done";
      assistant_message: string;
      agent: ChatAgentId;
      proposal?: ConversationSetupPlan | null;
      adhoc_proposal?: AdhocConversationProposal | null;
      ui_component?: SetupChatUiComponent | null;
    }
  | { type: "error"; message: string };

export interface AgentActivityToolStep {
  id: string;
  integration: ChatIntegrationId;
  name: string;
  label: string;
  args_preview?: string;
  status: "running" | "success" | "error";
}

export interface AgentActivityState {
  statusLabel: string;
  startedAt: number;
  completedAt?: number;
  tools: AgentActivityToolStep[];
}

export interface ChatStreamDoneResult {
  assistant_message: string;
  agent: ChatAgentId;
  proposal?: ConversationSetupPlan | null;
  adhoc_proposal?: AdhocConversationProposal | null;
  ui_component?: SetupChatUiComponent | null;
}

export interface ChatStreamCallbacks {
  onEvent?: (event: ChatStreamEvent) => void;
  onActivity?: (activity: AgentActivityState) => void;
}

function applyStreamEvent(
  activity: AgentActivityState,
  event: ChatStreamEvent,
): AgentActivityState {
  if (event.type === "status") {
    return { ...activity, statusLabel: event.label };
  }

  if (event.type === "tool_start") {
    return {
      ...activity,
      tools: [
        ...activity.tools,
        {
          id: event.id,
          integration: event.integration,
          name: event.name,
          label: formatToolLabel(event.integration, event.name),
          args_preview: event.args_preview,
          status: "running",
        },
      ],
    };
  }

  if (event.type === "tool_end") {
    return {
      ...activity,
      tools: activity.tools.map((tool) =>
        tool.id === event.id
          ? {
              ...tool,
              status: event.status === "success" ? "success" : "error",
            }
          : tool,
      ),
    };
  }

  if (event.type === "done" || event.type === "error") {
    return { ...activity, completedAt: Date.now() };
  }

  return activity;
}

export function formatToolLabel(
  integration: ChatIntegrationId,
  name: string,
): string {
  const ceptlyLabels: Record<string, string> = {
    query_checkins: "Searching check-ins",
    select_chat_agent: "Routing your request",
    match_roster_members: "Matching roster members",
    submit_adhoc_conversation_proposal: "Building reach-out plan",
    submit_conversation_plan: "Building schedule plan",
    load_existing_schedules: "Loading existing schedules",
  };

  if (integration === "ceptly" && ceptlyLabels[name]) {
    return ceptlyLabels[name]!;
  }

  const integrationName =
    integration === "linear"
      ? "Linear"
      : integration === "slack"
        ? "Slack"
        : "Ceptly";

  const formatted = name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${integrationName} ${formatted}`;
}

export function createInitialActivity(): AgentActivityState {
  return {
    statusLabel: "Thinking about your request",
    startedAt: Date.now(),
    tools: [],
  };
}

const MAX_CHAT_MESSAGES = 40;

/** Strip UI-only fields and cap length before sending to the API. */
export function normalizeChatMessagesForApi(
  messages: SetupChatMessage[],
): SetupChatMessage[] {
  const normalized = messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);

  if (normalized.length <= MAX_CHAT_MESSAGES) {
    return normalized;
  }

  const head = normalized.slice(0, 2);
  const tail = normalized.slice(-(MAX_CHAT_MESSAGES - head.length));
  return [...head, ...tail];
}

export async function streamChatWorkspace(
  workspaceId: string,
  messages: SetupChatMessage[],
  agent: ChatAgentId | undefined,
  callbacks: ChatStreamCallbacks,
): Promise<{ error?: string; result?: ChatStreamDoneResult }> {
  let activity = createInitialActivity();
  callbacks.onActivity?.(activity);

  try {
    const response = await fetch(
      `/api/workspaces/${workspaceId}/chat/stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: normalizeChatMessagesForApi(messages),
          agent,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        error: text || `Request failed (HTTP ${response.status}).`,
      };
    }

    if (!response.body) {
      return { error: "No response stream from server." };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const payload = trimmed.slice(5).trim();
        if (!payload) {
          continue;
        }

        let event: ChatStreamEvent;
        try {
          event = JSON.parse(payload) as ChatStreamEvent;
        } catch {
          continue;
        }

        callbacks.onEvent?.(event);
        activity = applyStreamEvent(activity, event);
        callbacks.onActivity?.(activity);

        if (event.type === "error") {
          return { error: event.message };
        }

        if (event.type === "done") {
          return {
            result: {
              assistant_message: event.assistant_message,
              agent: event.agent,
              proposal: event.proposal,
              adhoc_proposal: event.adhoc_proposal,
              ui_component: event.ui_component,
            },
          };
        }
      }
    }

    return { error: "Stream ended before a response was received." };
  } catch {
    return { error: "Could not reach the chat API." };
  }
}
