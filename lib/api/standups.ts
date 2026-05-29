import { resolveApiBaseUrl } from "./auth";
import type {
  ChannelStandupProposal,
  ConversationResultDestination,
  Standup,
  StandupSchedule,
  StandupSessionDetail,
  StandupSessionSummary,
  StandupStyle,
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

export async function listStandups(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { standups: Standup[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { standups: Standup[] } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export type StandupCreateBody = {
  name: string;
  slack_channel_id: string;
  style?: StandupStyle;
  custom_instructions?: string;
  roster_member_ids: string[];
  context_integrations?: string[];
  result_destinations?: ConversationResultDestination[];
  schedule: StandupSchedule;
};

export async function createStandup(
  accessToken: string,
  workspaceId: string,
  body: StandupCreateBody,
): Promise<{
  success: boolean;
  error?: string;
  data?: { standup: Standup };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{ data?: { standup: Standup } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateStandup(
  accessToken: string,
  workspaceId: string,
  standupId: string,
  body: Partial<StandupCreateBody>,
): Promise<{
  success: boolean;
  error?: string;
  data?: { standup: Standup };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups/${standupId}`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{ data?: { standup: Standup } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function deleteStandup(
  accessToken: string,
  workspaceId: string,
  standupId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups/${standupId}`,
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

export async function commitStandup(
  accessToken: string,
  workspaceId: string,
  body: StandupCreateBody & { standup_id?: string },
): Promise<{
  success: boolean;
  error?: string;
  data?: { standup: Standup };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups/commit`,
      {
        method: "POST",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<{ data?: { standup: Standup } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function listStandupSessions(
  accessToken: string,
  workspaceId: string,
  standupId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { sessions: StandupSessionSummary[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups/${standupId}/sessions`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { sessions: StandupSessionSummary[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getStandupSessionDetail(
  accessToken: string,
  workspaceId: string,
  standupId: string,
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { session: StandupSessionDetail };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/standups/${standupId}/sessions/${sessionId}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { session: StandupSessionDetail } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export function proposalToCommitBody(
  proposal: ChannelStandupProposal,
): StandupCreateBody & { standup_id?: string } {
  return {
    name: proposal.name,
    slack_channel_id: proposal.slack_channel_id,
    style: proposal.style,
    custom_instructions: proposal.custom_instructions,
    roster_member_ids: proposal.roster_member_ids,
    schedule: proposal.schedule,
    standup_id: proposal.standup_id,
  };
}
