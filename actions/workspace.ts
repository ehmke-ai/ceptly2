"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { patchWorkspaceName, putWorkspaceSchedule } from "@/lib/api/workspace";
import type { ScheduleFrequency } from "@/lib/api/types";
import { getAccessToken, setWorkspaceNameCookie } from "@/lib/auth/server";

const scheduleFrequencySchema = z.enum(["daily", "specific_days"]);

const workspaceScheduleSchema = z
  .object({
    workspaceId: z.string().uuid(),
    timezone: z.string().trim().min(1, "Timezone is required"),
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

const workspaceNameSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export type WorkspaceNameFormState = {
  errors?: {
    name?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function updateWorkspaceName(
  _state: WorkspaceNameFormState,
  formData: FormData,
): Promise<WorkspaceNameFormState> {
  const parsed = workspaceNameSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in to update the workspace."] } };
  }

  const result = await patchWorkspaceName(
    token,
    parsed.data.workspaceId,
    parsed.data.name,
  );

  if (!result.success) {
    return {
      errors: {
        _form: [result.error ?? "Failed to update workspace name."],
      },
    };
  }

  const workspace = result.data?.workspace;
  if (workspace?.name) {
    await setWorkspaceNameCookie(workspace.name);
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");

  return { success: true };
}

export type WorkspaceScheduleFormState = {
  errors?: {
    timezone?: string[];
    frequency?: string[];
    days_of_week?: string[];
    time_local?: string[];
    enabled?: string[];
    _form?: string[];
  };
  success?: boolean;
};

function parseDaysOfWeek(raw: FormDataEntryValue | null): number[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

export async function updateWorkspaceSchedule(
  _state: WorkspaceScheduleFormState,
  formData: FormData,
): Promise<WorkspaceScheduleFormState> {
  const parsed = workspaceScheduleSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    timezone: formData.get("timezone"),
    frequency: formData.get("frequency"),
    days_of_week: parseDaysOfWeek(formData.get("days_of_week")),
    time_local: formData.get("time_local"),
    enabled: formData.get("enabled") === "true",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return {
      errors: { _form: ["You must be signed in to update the schedule."] },
    };
  }

  const schedule = {
    timezone: parsed.data.timezone,
    frequency: parsed.data.frequency as ScheduleFrequency,
    days_of_week: parsed.data.days_of_week,
    time_local: parsed.data.time_local,
    enabled: parsed.data.enabled,
  };

  const result = await putWorkspaceSchedule(
    token,
    parsed.data.workspaceId,
    schedule,
  );

  if (!result.success) {
    return {
      errors: {
        _form: [result.error ?? "Failed to update check-in schedule."],
      },
    };
  }

  revalidatePath("/settings");

  return { success: true };
}
