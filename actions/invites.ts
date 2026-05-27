"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  acceptInvite as acceptInviteApi,
  createInvite,
  revokeInvite,
} from "@/lib/api/invites";
import { getAccessToken, setOnboardingCompleteCookie } from "@/lib/auth/server";

const emailSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().trim().email(),
});

const revokeSchema = z.object({
  workspaceId: z.string().uuid(),
  inviteId: z.string().uuid(),
});

export async function createInviteAction(
  _state: {
    error?: string;
    success?: boolean;
    inviteUrl?: string;
    seatLimitReached?: boolean;
  },
  formData: FormData,
): Promise<{
  error?: string;
  success?: boolean;
  inviteUrl?: string;
  seatLimitReached?: boolean;
}> {
  const parsed = emailSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to send invites." };
  }

  const result = await createInvite(
    token,
    parsed.data.workspaceId,
    parsed.data.email,
  );

  if (!result.success || !result.data?.invite) {
    if (result.code === "SEAT_LIMIT_REACHED") {
      return {
        error:
          result.error ??
          "All seats are in use. Add seats in billing settings to invite more teammates.",
        seatLimitReached: true as const,
      };
    }
    return { error: result.error ?? "Failed to send invite." };
  }

  revalidatePath("/settings");
  return {
    success: true,
    inviteUrl: result.data.invite.inviteUrl,
    seatLimitReached: false,
  };
}

export async function revokeInviteAction(
  workspaceId: string,
  inviteId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = revokeSchema.safeParse({ workspaceId, inviteId });
  if (!parsed.success) {
    return { error: "Invalid invite." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to revoke invites." };
  }

  const result = await revokeInvite(
    token,
    parsed.data.workspaceId,
    parsed.data.inviteId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to revoke invite." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function acceptInviteAction(
  _state: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const token = formData.get("token")?.toString();
  if (!token) {
    return { error: "Invalid invite." };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: "You must be signed in to accept this invite." };
  }

  const result = await acceptInviteApi(accessToken, token);
  if (!result.success) {
    return { error: result.error ?? "Failed to accept invite." };
  }

  await setOnboardingCompleteCookie(true);
  revalidatePath("/settings");
  redirect("/chat");
}
