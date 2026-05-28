import { resolveApiBaseUrl } from "./auth";
import type {
  AppContextOption,
  ConversationPreview,
  ConversationQuestion,
  ConversationResultDestination,
  ConversationTemplate,
  ScheduledConversation,
  ScheduleFrequency,
  WorkspaceSchedule,
} from "./types";

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

function authHeaders(accessToken: string, json = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function listAppContextOptions(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { app_contexts: AppContextOption[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/app-contexts`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { app_contexts: AppContextOption[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function listConversationTemplates(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { templates: ConversationTemplate[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/templates`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    const parsed = await parseJsonResponse<{
      data?: { templates: ConversationTemplate[] };
    }>(response);

    if (!response.ok) {
      return {
        success: false,
        error:
          parsed.error ?? `Failed to load templates (HTTP ${response.status}).`,
      };
    }

    return parsed;
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function createConversationFromTemplate(
  accessToken: string,
  workspaceId: string,
  body: {
    template_id: string;
    name?: string;
    summary?: string | null;
    schedule?: WorkspaceSchedule;
    roster_member_ids?: string[];
    context_integrations?: string[];
    result_destinations?: ConversationResultDestination[];
  },
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversation: ScheduledConversation };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/from-template`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{
      data?: { conversation: ScheduledConversation };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function listConversations(
  accessToken: string,
  workspaceId: string,
  options?: { includeQuestions?: boolean; includeMembers?: boolean },
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversations: ScheduledConversation[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const params = new URLSearchParams();
    if (options?.includeQuestions) {
      params.set("include", "questions");
    } else if (options?.includeMembers) {
      params.set("include", "members");
    }
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations${query}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{
      data?: { conversations: ScheduledConversation[] };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getConversation(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversation: ScheduledConversation };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{
      data?: { conversation: ScheduledConversation };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function createConversation(
  accessToken: string,
  workspaceId: string,
  body: {
    name: string;
    summary?: string | null;
    template_id?: string | null;
    schedule: WorkspaceSchedule;
    roster_member_ids?: string[];
    questions?: string[];
    context_integrations?: string[];
  },
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversation: ScheduledConversation };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{
      data?: { conversation: ScheduledConversation };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateConversation(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  body: {
    name?: string;
    summary?: string | null;
    template_id?: string | null;
    schedule?: WorkspaceSchedule;
    roster_member_ids?: string[];
    context_integrations?: string[];
    result_destinations?: ConversationResultDestination[];
  },
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversation: ScheduledConversation };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{
      data?: { conversation: ScheduledConversation };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function deleteConversationApi(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
      },
    );
    return parseJsonResponse(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function createConversationQuestion(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  promptText: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { question: ConversationQuestion };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/questions`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ prompt_text: promptText }),
      },
    );
    return parseJsonResponse<{ data?: { question: ConversationQuestion } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateConversationQuestion(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  questionId: string,
  body: { prompt_text?: string; enabled?: boolean },
): Promise<{
  success: boolean;
  error?: string;
  data?: { question: ConversationQuestion };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/questions/${questionId}`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{ data?: { question: ConversationQuestion } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function deleteConversationQuestion(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  questionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
      },
    );
    return parseJsonResponse(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function reorderConversationQuestions(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  orderedIds: string[],
): Promise<{
  success: boolean;
  error?: string;
  data?: { questions: ConversationQuestion[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/questions/reorder`,
      {
        method: "PUT",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ ordered_ids: orderedIds }),
      },
    );
    return parseJsonResponse<{ data?: { questions: ConversationQuestion[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getConversationPreview(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { preview: ConversationPreview };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/preview`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { preview: ConversationPreview } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export function conversationToSchedule(
  conversation: Pick<
    ScheduledConversation,
    "timezone" | "frequency" | "days_of_week" | "time_local" | "enabled"
  >,
): WorkspaceSchedule {
  return {
    timezone: conversation.timezone,
    frequency: conversation.frequency as ScheduleFrequency,
    days_of_week: conversation.days_of_week,
    time_local: conversation.time_local,
    enabled: conversation.enabled,
  };
}

export async function getWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: { timezone: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/timezone`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { timezone: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function patchWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
  timezone: string,
): Promise<{ success: boolean; error?: string; data?: { timezone: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/timezone`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ timezone }),
      },
    );
    return parseJsonResponse<{ data?: { timezone: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: { language: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/language`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { language: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function patchWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
  language: string,
): Promise<{ success: boolean; error?: string; data?: { language: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/language`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ language }),
      },
    );
    return parseJsonResponse<{ data?: { language: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
