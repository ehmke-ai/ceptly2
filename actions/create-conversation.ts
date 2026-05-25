"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createConversationFromTemplate } from "@/lib/api/conversations";
import type { WorkspaceSchedule } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

const scheduleSchema = z.object({
  timezone: z.string().trim().min(1),
  frequency: z.enum(["daily", "specific_days"]),
  days_of_week: z.array(z.number().int().min(0).max(6)),
  time_local: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  enabled: z.boolean(),
});

const schema = z.object({
  workspaceId: z.string().uuid(),
  templateId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  rosterMemberIds: z.array(z.string().uuid()).min(1),
  contextIntegrations: z.array(z.enum(["linear", "jira", "monday"])).optional(),
  schedule: scheduleSchema,
});

export async function publishConversationFromTemplate(input: {
  workspaceId: string;
  templateId: string;
  name?: string;
  rosterMemberIds: string[];
  contextIntegrations?: string[];
  schedule: WorkspaceSchedule;
}): Promise<{ error?: string; conversationId?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await createConversationFromTemplate(
    token,
    parsed.data.workspaceId,
    {
      template_id: parsed.data.templateId,
      name: parsed.data.name,
      roster_member_ids: parsed.data.rosterMemberIds,
      context_integrations: parsed.data.contextIntegrations,
      schedule: parsed.data.schedule,
    },
  );

  if (!result.success || !result.data?.conversation) {
    return { error: result.error ?? "Failed to create conversation." };
  }

  revalidatePath("/settings/conversations");
  redirect(`/settings/conversations/${result.data.conversation.id}`);
}
