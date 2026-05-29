"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  commitStandup,
  createStandup,
  deleteStandup,
  getStandupSessionDetail,
  listStandupSessions,
  listStandups,
  proposalToCommitBody,
  updateStandup,
  type StandupCreateBody,
} from "@/lib/api/standups";
import type {
  ChannelStandupProposal,
  Standup,
  StandupSessionDetail,
  StandupSessionSummary,
} from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";
import { isScheduleTimeOnInterval } from "@/lib/schedule/interval";

const scheduleFrequencySchema = z.enum(["daily", "specific_days"]);

const standupScheduleSchema = z
  .object({
    timezone: z.string().trim().min(1),
    frequency: scheduleFrequencySchema,
    days_of_week: z.array(z.number().int().min(0).max(6)),
    time_local: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm")
      .refine(
        isScheduleTimeOnInterval,
        "Time must be on a 15-minute interval (e.g. 09:00, 09:15)",
      ),
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

const standupBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slack_channel_id: z.string().trim().min(1).max(64),
  style: z.enum(["broadcast", "sequential"]).default("broadcast"),
  custom_instructions: z.string().max(4000).default(""),
  roster_member_ids: z.array(z.string().uuid()).min(1).max(20),
  schedule: standupScheduleSchema,
});

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("You must be signed in.");
  }
  return token;
}

function revalidateStandupPaths(): void {
  revalidatePath("/activity");
  revalidatePath("/settings/standups");
}

export async function fetchStandups(input: {
  workspaceId: string;
}): Promise<{ standups: Standup[]; error?: string }> {
  try {
    const token = await requireToken();
    const result = await listStandups(token, input.workspaceId);
    if (!result.success) {
      return { standups: [], error: result.error ?? "Failed to load standups." };
    }
    return { standups: result.data?.standups ?? [] };
  } catch (error) {
    return {
      standups: [],
      error: error instanceof Error ? error.message : "Failed to load standups.",
    };
  }
}

export async function saveStandupAction(input: {
  workspaceId: string;
  standupId?: string;
  body: StandupCreateBody;
}): Promise<{ standup?: Standup; error?: string }> {
  const parsed = standupBodySchema.safeParse(input.body);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const token = await requireToken();
    const result = input.standupId
      ? await updateStandup(
          token,
          input.workspaceId,
          input.standupId,
          parsed.data,
        )
      : await createStandup(token, input.workspaceId, parsed.data);

    if (!result.success) {
      return { error: result.error ?? "Failed to save standup." };
    }

    revalidateStandupPaths();
    return { standup: result.data?.standup };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save standup.",
    };
  }
}

export async function deleteStandupAction(input: {
  workspaceId: string;
  standupId: string;
}): Promise<{ error?: string }> {
  try {
    const token = await requireToken();
    const result = await deleteStandup(
      token,
      input.workspaceId,
      input.standupId,
    );

    if (!result.success) {
      return { error: result.error ?? "Failed to delete standup." };
    }

    revalidateStandupPaths();
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete standup.",
    };
  }
}

export async function commitChannelStandupProposalAction(
  workspaceId: string,
  proposal: ChannelStandupProposal,
): Promise<{ error?: string }> {
  const body = proposalToCommitBody(proposal);
  const parsed = standupBodySchema
    .extend({ standup_id: z.string().uuid().optional() })
    .safeParse(body);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid proposal." };
  }

  try {
    const token = await requireToken();
    const result = await commitStandup(token, workspaceId, parsed.data);

    if (!result.success) {
      return { error: result.error ?? "Failed to save standup." };
    }

    revalidateStandupPaths();
    revalidatePath("/chat");
    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save standup.",
    };
  }
}

export async function fetchStandupSessions(input: {
  workspaceId: string;
  standupId: string;
}): Promise<{ sessions: StandupSessionSummary[]; error?: string }> {
  try {
    const token = await requireToken();
    const result = await listStandupSessions(
      token,
      input.workspaceId,
      input.standupId,
    );
    if (!result.success) {
      return {
        sessions: [],
        error: result.error ?? "Failed to load sessions.",
      };
    }
    return { sessions: result.data?.sessions ?? [] };
  } catch (error) {
    return {
      sessions: [],
      error:
        error instanceof Error ? error.message : "Failed to load sessions.",
    };
  }
}

export async function fetchStandupSessionDetail(input: {
  workspaceId: string;
  standupId: string;
  sessionId: string;
}): Promise<{ session: StandupSessionDetail | null; error?: string }> {
  try {
    const token = await requireToken();
    const result = await getStandupSessionDetail(
      token,
      input.workspaceId,
      input.standupId,
      input.sessionId,
    );
    if (!result.success) {
      return {
        session: null,
        error: result.error ?? "Failed to load session.",
      };
    }
    return { session: result.data?.session ?? null };
  } catch (error) {
    return {
      session: null,
      error:
        error instanceof Error ? error.message : "Failed to load session.",
    };
  }
}
