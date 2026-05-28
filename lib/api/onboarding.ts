import type { OnboardingCompleteInput } from "@/lib/onboarding-schemas";

import { resolveApiBaseUrl } from "./auth";

export const ONBOARDING_ENDPOINTS = {
  status: "/api/onboarding",
  complete: "/api/onboarding/complete",
} as const;

export interface OnboardingStatusResponse {
  success: boolean;
  data?: {
    completed: boolean;
    workspaceId?: string;
    organizationName?: string;
    role?: OnboardingCompleteInput["role"];
    referralSource?: OnboardingCompleteInput["referralSource"];
    referralSourceOther?: string | null;
    toolsUsed?: OnboardingCompleteInput["toolsUsed"];
    inviteEmails?: string[];
  };
  error?: string;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function fetchOnboardingStatus(
  accessToken: string,
): Promise<OnboardingStatusResponse["data"] | null> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${ONBOARDING_ENDPOINTS.status}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as OnboardingStatusResponse;
    return result.success ? (result.data ?? null) : null;
  } catch {
    return null;
  }
}

function buildOnboardingBody(
  payload: OnboardingCompleteInput,
): OnboardingCompleteInput {
  const body: OnboardingCompleteInput = {
    role: payload.role,
    referralSource: payload.referralSource,
    organizationName: payload.organizationName.trim(),
  };

  const other = payload.referralSourceOther?.trim();
  if (payload.referralSource === "other" && other && other !== "$undefined") {
    body.referralSourceOther = other;
  }

  if (payload.inviteEmails?.length) {
    body.inviteEmails = payload.inviteEmails;
  }

  if (payload.toolsUsed?.length) {
    body.toolsUsed = payload.toolsUsed;
  }

  return body;
}

export async function postOnboardingComplete(
  accessToken: string,
  payload: OnboardingCompleteInput,
): Promise<OnboardingCompleteResponse> {
  let response: Response;

  try {
    const base = await resolveApiBaseUrl();
    response = await fetch(`${base}${ONBOARDING_ENDPOINTS.complete}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOnboardingBody(payload)),
    });
  } catch {
    return {
      success: false,
      error:
        "Could not reach the API. Start the local backend or deploy the latest ceptly-backend.",
    };
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    if (response.status === 404) {
      return {
        success: false,
        error:
          "Onboarding API is not deployed yet. Run ceptly-backend locally or deploy the latest backend to Render.",
      };
    }

    return {
      success: false,
      error: `API error (${response.status}). Ensure the latest backend is running.`,
    };
  }

  return (await response.json()) as OnboardingCompleteResponse;
}
