"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addRosterMember,
  deleteRosterMember,
  updateRosterMember,
} from "@/lib/api/roster";
import { getAccessToken } from "@/lib/auth/server";

const emailSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().trim().email(),
});

const updateSchema = z.object({
  workspaceId: z.string().uuid(),
  memberId: z.string().uuid(),
  paused: z.boolean().optional(),
});

const deleteSchema = z.object({
  workspaceId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export async function addRosterMemberAction(
  _state: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = emailSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await addRosterMember(
    token,
    parsed.data.workspaceId,
    parsed.data.email,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to add team member." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { success: true };
}

export async function toggleRosterMemberPaused(
  workspaceId: string,
  memberId: string,
  paused: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = updateSchema.safeParse({ workspaceId, memberId, paused });
  if (!parsed.success) {
    return { error: "Invalid roster member." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await updateRosterMember(
    token,
    parsed.data.workspaceId,
    parsed.data.memberId,
    { paused: parsed.data.paused },
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update team member." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { success: true };
}

export async function removeRosterMemberAction(
  workspaceId: string,
  memberId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = deleteSchema.safeParse({ workspaceId, memberId });
  if (!parsed.success) {
    return { error: "Invalid roster member." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await deleteRosterMember(
    token,
    parsed.data.workspaceId,
    parsed.data.memberId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to remove team member." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { success: true };
}
