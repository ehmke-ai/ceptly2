import Link from "next/link";
import { redirect } from "next/navigation";

import { ConversationDetailActions } from "@/components/activity/conversation-detail-actions";
import { ConversationEditPageClient } from "@/components/activity/conversation-edit-page-client";
import { ConversationResultsClient } from "@/components/activity/conversation-results-client";
import { ConversationSessionsClient } from "@/components/activity/conversation-sessions-client";
import { buttonVariants } from "@/components/ui/button";
import {
  getConversationSession,
  listConversationSessions,
} from "@/lib/api/conversation-sessions";
import {
  getConversation,
  listAppContextOptions,
  listConversations,
} from "@/lib/api/conversations";
import {
  getLatestConversationRun,
  listConversationRuns,
} from "@/lib/api/conversation-results";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface ActivityConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ActivityConversationPage({
  params,
  searchParams,
}: ActivityConversationPageProps) {
  const { conversationId } = await params;
  const { edit } = await searchParams;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
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

  const conversationResult = await getConversation(
    token,
    workspace.id,
    conversationId,
  );
  if (!conversationResult.success || !conversationResult.data?.conversation) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {conversationResult.error ?? "Conversation not found."}
      </p>
    );
  }

  const conversation = conversationResult.data.conversation;
  const isAdhoc = conversation.kind === "adhoc";
  const canEdit = canManageWorkspace(workspace.role);
  const isEditing = edit === "1" && canEdit && !isAdhoc;

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

  if (isEditing) {
    const [rosterResult, appContextsResult, slackChannelsResult] =
      await Promise.all([
        listRosterMembers(token, workspace.id),
        listAppContextOptions(token, workspace.id),
        listSlackChannels(token, workspace.id),
      ]);

    const rosterMembers = rosterResult.data?.members ?? [];
    const appContextOptions = appContextsResult.data?.app_contexts ?? [];
    const slackChannels = slackChannelsResult.data?.channels ?? [];
    const slackChannelsError = slackChannelsResult.success
      ? null
      : (slackChannelsResult.error ?? "Could not load Slack channels.");

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
        <div className="space-y-4">
          <Link
            href={`/activity/${conversationId}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
            )}
          >
            &lt; {conversation.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit {conversation.name}
          </h1>
        </div>

        <ConversationEditPageClient
          conversation={conversation}
          workspaceId={workspace.id}
          rosterMembers={rosterMembers}
          appContextOptions={appContextOptions}
          slackChannels={slackChannels}
          slackChannelsError={slackChannelsError}
        />
      </div>
    );
  }

  const [runsResult, latestResult, allConversationsResult] = await Promise.all([
    listConversationRuns(token, workspace.id, conversationId),
    getLatestConversationRun(token, workspace.id, conversationId),
    canEdit ? listConversations(token, workspace.id) : Promise.resolve(null),
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
  const conversationCount =
    allConversationsResult?.data?.conversations?.length ?? 1;
  const canDelete = canEdit && conversationCount > 1;

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
          <p className="mt-1 text-sm text-muted-foreground">
            {schedulePreview}
          </p>
        </div>

        {canEdit ? (
          <ConversationDetailActions
            workspaceId={workspace.id}
            conversationId={conversationId}
            conversationName={conversation.name}
            canDelete={canDelete}
          />
        ) : null}
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
