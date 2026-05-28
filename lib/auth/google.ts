import { getApiBaseUrl } from "@/lib/api/auth";

const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not available right now. Please use email and password.",
  google_denied: "Google sign-in was canceled.",
  google_auth_failed: "Google sign-in failed. Please try again.",
};

export function getGoogleAuthUrl(options?: {
  inviteToken?: string;
}): string {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  params.set("return_to", "/auth/google/callback");

  if (options?.inviteToken) {
    params.set("invite", options.inviteToken);
  }

  return `${base}/api/auth/google?${params.toString()}`;
}

export function resolveGoogleAuthError(code: string | null): string | null {
  if (!code) {
    return null;
  }

  return GOOGLE_AUTH_ERRORS[code] ?? decodeURIComponent(code);
}
