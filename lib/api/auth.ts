export const AUTH_ENDPOINTS = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
} as const;

let cachedServerApiBaseUrl: string | null = null;

/** Client-safe base URL (always the public/deployed API). */
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return base.replace(/\/$/, "");
}

/**
 * Server-side base URL. Prefers API_URL when the local backend is reachable,
 * otherwise falls back to NEXT_PUBLIC_API_URL (e.g. Render).
 */
async function probeLocalBackend(localUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${localUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveApiBaseUrl(): Promise<string> {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const localUrl = process.env.API_URL?.replace(/\/$/, "");

  if (!publicUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  if (localUrl && localUrl !== publicUrl) {
    const localUp = await probeLocalBackend(localUrl);
    if (localUp) {
      cachedServerApiBaseUrl = localUrl;
      return localUrl;
    }
  }

  if (cachedServerApiBaseUrl) {
    return cachedServerApiBaseUrl;
  }

  cachedServerApiBaseUrl = publicUrl;
  return publicUrl;
}
