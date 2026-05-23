"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createConversationQuestion,
  deleteConversationApi,
  deleteConversationQuestion,
  getConversation,
  patchWorkspaceTimezone,
  reorderConversationQuestions,
  updateConversation,
  updateConversationQuestion,
} from "@/lib/api/conversations";
import type { WorkspaceSchedule } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

const scheduleFrequencySchema = z.enum(["daily", "specific_days"]);

const workspaceScheduleSchema = z
  .object({
    timezone: z.string().trim().min(1),
    frequency: scheduleFrequencySchema,
    days_of_week: z.array(z.number().int().min(0).max(6)),
    time_local: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm"),
    enabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === "specific_days" && data.days_of_week.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one day",
        path: ["days_of_week"],
      });
    }
  });

const conversationQuestionInputSchema = z.object({
  id: z.string().uuid().optional(),
  prompt_text: z.string().trim().min(1).max(500),
  enabled: z.boolean(),
});

const saveConversationSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  schedule: workspaceScheduleSchema,
  questions: z.array(conversationQuestionInputSchema).min(1),
});

export type WorkspaceTimezoneFormState = {
  errors?: { timezone?: string[]; _form?: string[] };
  success?: boolean;
};

export async function updateWorkspaceTimezone(
  _state: WorkspaceTimezoneFormState,
  formData: FormData,
): Promise<WorkspaceTimezoneFormState> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      timezone: z.string().trim().min(1),
    })
    .safeParse({
      workspaceId: formData.get("workspaceId"),
      timezone: formData.get("timezone"),
    });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in."] } };
  }

  const result = await patchWorkspaceTimezone(
    token,
    parsed.data.workspaceId,
    parsed.data.timezone,
  );

  if (!result.success) {
    return { errors: { _form: [result.error ?? "Failed to update timezone."] } };
  }

  revalidatePath("/settings");
  revalidatePath("/settings/conversations");

  return { success: true };
}

export async function saveConversation(input: {
  workspaceId: string;
  conversationId: string;
  name: string;
  schedule: WorkspaceSchedule;
  questions: { id?: string; prompt_text: string; enabled: boolean }[];
}): Promise<{ error?: string }> {
  const parsed = saveConversationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid conversation data.",
    };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const { workspaceId, conversationId, name, schedule } = parsed.data;
  const questionItems = parsed.data.questions.map((question) => ({
    ...question,
  }));

  const existingResult = await getConversation(
    token,
    workspaceId,
    conversationId,
  );
  if (!existingResult.success || !existingResult.data?.conversation) {
    return { error: existingResult.error ?? "Conversation not found." };
  }

  const existingQuestions = existingResult.data.conversation.questions ?? [];
  const existingIds = new Set(existingQuestions.map((question) => question.id));
  const submittedIds = new Set(
    questionItems.flatMap((question) => (question.id ? [question.id] : [])),
  );

  for (const id of submittedIds) {
    if (!existingIds.has(id)) {
      return { error: "One or more questions could not be found." };
    }
  }

  const updateResult = await updateConversation(
    token,
    workspaceId,
    conversationId,
    { name, schedule: schedule as WorkspaceSchedule },
  );
  if (!updateResult.success) {
    return { error: updateResult.error ?? "Failed to update conversation." };
  }

  for (const question of questionItems) {
    if (!question.id) {
      continue;
    }

    const existing = existingQuestions.find((item) => item.id === question.id);
    if (!existing) {
      continue;
    }

    if (
      existing.prompt_text !== question.prompt_text ||
      existing.enabled !== question.enabled
    ) {
      const result = await updateConversationQuestion(
        token,
        workspaceId,
        conversationId,
        question.id,
        {
          prompt_text: question.prompt_text,
          enabled: question.enabled,
        },
      );
      if (!result.success) {
        return { error: result.error ?? "Failed to update a question." };
      }
    }
  }

  for (const existing of existingQuestions) {
    if (!submittedIds.has(existing.id)) {
      const result = await deleteConversationQuestion(
        token,
        workspaceId,
        conversationId,
        existing.id,
      );
      if (!result.success) {
        return { error: result.error ?? "Failed to delete a question." };
      }
    }
  }

  for (const question of questionItems) {
    if (question.id) {
      continue;
    }

    const result = await createConversationQuestion(
      token,
      workspaceId,
      conversationId,
      question.prompt_text,
    );
    if (!result.success || !result.data?.question) {
      return { error: result.error ?? "Failed to add a question." };
    }

    question.id = result.data.question.id;

    if (!question.enabled) {
      const disableResult = await updateConversationQuestion(
        token,
        workspaceId,
        conversationId,
        result.data.question.id,
        { enabled: false },
      );
      if (!disableResult.success) {
        return { error: disableResult.error ?? "Failed to update a question." };
      }
    }
  }

  const desiredOrder = questionItems
    .map((question) => question.id)
    .filter(Boolean);

  if (desiredOrder.length !== questionItems.length) {
    return { error: "Failed to resolve question order." };
  }

  const refreshedResult = await getConversation(
    token,
    workspaceId,
    conversationId,
  );
  const refreshedQuestions =
    refreshedResult.data?.conversation.questions ?? [];

  const currentOrder = [...refreshedQuestions]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((question) => question.id);

  const orderChanged = desiredOrder.some(
    (id, index) => id !== currentOrder[index],
  );

  if (orderChanged) {
    const reorderResult = await reorderConversationQuestions(
      token,
      workspaceId,
      conversationId,
      desiredOrder as string[],
    );
    if (!reorderResult.success) {
      return { error: reorderResult.error ?? "Failed to reorder questions." };
    }
  }

  revalidatePath("/settings/conversations");
  revalidatePath("/settings");
  revalidatePath("/");

  return {};
}

export async function removeConversation(input: {
  workspaceId: string;
  conversationId: string;
}): Promise<{ error?: string }> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      conversationId: z.string().uuid(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { error: "Invalid conversation." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await deleteConversationApi(
    token,
    parsed.data.workspaceId,
    parsed.data.conversationId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to delete conversation." };
  }

  revalidatePath("/settings/conversations");
  revalidatePath("/settings");
  revalidatePath("/");

  return {};
}
