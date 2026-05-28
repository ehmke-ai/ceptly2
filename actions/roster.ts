"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addRosterMember,
  deleteRosterMember,
  importRosterFromJira,
  importRosterFromLinear,
  importRosterFromSlack,
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

const localeUpdateSchema = z.object({
  workspaceId: z.string().uuid(),
  memberId: z.string().uuid(),
  timezone: z.string().trim().min(1).nullable().optional(),
  language: z.string().trim().min(1).nullable().optional(),
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

export async function updateRosterMemberLocale(
  workspaceId: string,
  memberId: string,
  payload: { timezone?: string | null; language?: string | null },
): Promise<{ error?: string; success?: boolean }> {
  const parsed = localeUpdateSchema.safeParse({
    workspaceId,
    memberId,
    ...payload,
  });
  if (!parsed.success) {
    return { error: "Invalid roster member." };
  }

  if (
    parsed.data.timezone === undefined &&
    parsed.data.language === undefined
  ) {
    return { error: "No locale fields to update." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const updatePayload: { timezone?: string | null; language?: string | null } =
    {};
  if (parsed.data.timezone !== undefined) {
    updatePayload.timezone = parsed.data.timezone;
  }
  if (parsed.data.language !== undefined) {
    updatePayload.language = parsed.data.language;
  }

  const result = await updateRosterMember(
    token,
    parsed.data.workspaceId,
    parsed.data.memberId,
    updatePayload,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update team member." };
  }

  revalidatePath("/team");
  return { success: true };
}

function formatImportResult(data: {
  added: number;
  skipped: number;
  failed: number;
}): string {
  const parts: string[] = [];

  if (data.added > 0) {
    parts.push(`Added ${data.added} member${data.added === 1 ? "" : "s"}`);
  }

  if (data.skipped > 0) {
    parts.push(`Skipped ${data.skipped} already on roster or without a match`);
  }

  if (data.failed > 0) {
    parts.push(`Failed to add ${data.failed}`);
  }

  if (parts.length === 0) {
    return "No new members to import.";
  }

  return parts.join(". ") + ".";
}

export async function importRosterFromSlackAction(
  workspaceId: string,
): Promise<{ error?: string; message?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await importRosterFromSlack(token, workspaceId);

  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to import from Slack." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { message: formatImportResult(result.data) };
}

export async function importRosterFromLinearAction(
  workspaceId: string,
): Promise<{ error?: string; message?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await importRosterFromLinear(token, workspaceId);

  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to import from Linear." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { message: formatImportResult(result.data) };
}

export async function importRosterFromJiraAction(
  workspaceId: string,
): Promise<{ error?: string; message?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage the roster." };
  }

  const result = await importRosterFromJira(token, workspaceId);

  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to import from Jira." };
  }

  revalidatePath("/settings");
  revalidatePath("/team");
  return { message: formatImportResult(result.data) };
}
