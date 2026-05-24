"use server";

import { redirect } from "next/navigation";

import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "@/lib/api/auth";
import type { AuthMeResponse, AuthSessionResponse } from "@/lib/api/types";
import {
  SignInFormSchema,
  SignUpFormSchema,
  type FormState,
} from "@/lib/auth-schemas";
import {
  clearAuthCookies,
  setAuthCookies,
  setOnboardingCompleteCookie,
} from "@/lib/auth/server";

async function resolvePostAuthRedirect(
  accessToken: string,
  inviteToken?: string,
): Promise<string> {
  if (inviteToken) {
    await setOnboardingCompleteCookie(true);
    return `/invite/${inviteToken}`;
  }

  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return "/chat";
    }

    const result = (await response.json()) as AuthMeResponse;
    const onboardingCompleted = result.data?.user.onboardingCompleted ?? false;

    await setOnboardingCompleteCookie(onboardingCompleted);

    return onboardingCompleted ? "/chat" : "/onboarding";
  } catch {
    return "/onboarding";
  }
}

async function authenticate(
  endpoint: string,
  body: Record<string, string>,
  options?: { inviteToken?: string; isRegister?: boolean },
): Promise<FormState> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        errors: {
          _form: ["Server error. Please try again later."],
        },
      };
    }

    const result = (await response.json()) as AuthSessionResponse;

    if (!response.ok || !result.success || !result.data) {
      return {
        errors: {
          _form: [result.error ?? "Authentication failed. Please try again."],
        },
      };
    }

    await setAuthCookies(result.data.session);

    if (options?.inviteToken && options.isRegister) {
      await setOnboardingCompleteCookie(true);
      redirect("/chat");
    }

    const redirectPath = await resolvePostAuthRedirect(
      result.data.session.access_token,
      options?.inviteToken,
    );
    redirect(redirectPath);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      errors: {
        _form: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}

export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = SignInFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const inviteToken = formData.get("inviteToken")?.toString();
  return authenticate(
    AUTH_ENDPOINTS.login,
    { email, password },
    inviteToken ? { inviteToken } : undefined,
  );
}

export async function signUp(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const validatedFields = SignUpFormSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password } = validatedFields.data;
  const inviteToken = formData.get("inviteToken")?.toString();
  const body: Record<string, string> = { fullName, email, password };
  if (inviteToken) {
    body.inviteToken = inviteToken;
  }
  return authenticate(AUTH_ENDPOINTS.register, body, {
    inviteToken,
    isRegister: true,
  });
}

export async function signOutForInvite(inviteToken: string) {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      await fetch(`${base}${AUTH_ENDPOINTS.logout}`, {
        method: "POST",
      });
    }
  } catch {
    // Clearing local session is enough for logout.
  }

  await clearAuthCookies();
  redirect(`/auth?invite=${encodeURIComponent(inviteToken)}`);
}

export async function signOut() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      await fetch(`${base}${AUTH_ENDPOINTS.logout}`, {
        method: "POST",
      });
    }
  } catch {
    // Clearing local session is enough for logout.
  }

  await clearAuthCookies();
  redirect("/auth");
}
