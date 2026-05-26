import Link from "next/link";
import { redirect } from "next/navigation";

import { ConversationResultsClient } from "@/components/activity/conversation-results-client";
import { ConversationSessionsClient } from "@/components/activity/conversation-sessions-client";
import { buttonVariants } from "@/components/ui/button";
import {
  getConversationSession,
  listConversationSessions,
} from "@/lib/api/conversation-sessions";
import { getConversation } from "@/lib/api/conversations";
import {
  getLatestConversationRun,
  listConversationRuns,
} from "@/lib/api/conversation-results";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import { isLeadershipRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface ActivityConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ActivityConversationPage({
  params,
}: ActivityConversationPageProps) {
  const { conversationId } = await params;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!isLeadershipRole(workspace?.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!workspace?.id || !token) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Could not load conversation.
      </p>
    );
  }

  const conversationResult = await getConversation(token, workspace.id, conversationId);
  if (!conversationResult.success || !conversationResult.data?.conversation) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {conversationResult.error ?? "Conversation not found."}
      </p>
    );
  }

  const conversation = conversationResult.data.conversation;
  const isAdhoc = conversation.kind === "adhoc";

  if (isAdhoc) {
    const sessionsResult = await listConversationSessions(
      token,
      workspace.id,
      conversationId,
    );
    const sessions = sessionsResult.data?.sessions ?? [];
    const firstSessionId = sessions[0]?.session_id;
    const initialSessionResult =
      firstSessionId && token
        ? await getConversationSession(
            token,
            workspace.id,
            conversationId,
            firstSessionId,
          )
        : null;
    const initialSession = initialSessionResult?.data?.session ?? null;

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
        <div className="space-y-4">
          <Link
            href="/activity"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
            )}
          >
            &lt; Activity
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {conversation.name}
            </h1>
            {conversation.summary ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {conversation.summary}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">Reach out</p>
          </div>
        </div>

        <ConversationSessionsClient
          workspaceId={workspace.id}
          conversationId={conversationId}
          sessions={sessions}
          initialSession={initialSession}
        />
      </div>
    );
  }

  const [runsResult, latestResult] = await Promise.all([
    listConversationRuns(token, workspace.id, conversationId),
    getLatestConversationRun(token, workspace.id, conversationId),
  ]);

  const runs = runsResult.data?.runs ?? [];
  const latestRun = latestResult.data?.run ?? null;
  const schedulePreview = formatSchedulePreview(
    conversation.time_local,
    conversation.timezone,
    conversation.frequency,
    conversation.days_of_week,
    conversation.enabled,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/activity"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Activity
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {conversation.name}
          </h1>
          {conversation.summary ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {conversation.summary}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">{schedulePreview}</p>
        </div>
      </div>

      <ConversationResultsClient
        workspaceId={workspace.id}
        conversationId={conversationId}
        runs={runs}
        initialRun={latestRun}
      />
    </div>
  );
}
