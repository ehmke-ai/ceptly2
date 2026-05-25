import Link from "next/link";

import { ConversationResultsClient } from "@/components/settings/conversation-results-client";
import { buttonVariants } from "@/components/ui/button";
import { getConversation } from "@/lib/api/conversations";
import {
  getLatestConversationRun,
  listConversationRuns,
} from "@/lib/api/conversation-results";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import { cn } from "@/lib/utils";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const token = await getAccessToken();

  if (!workspace?.id || !token) {
    return (
      <p className="text-sm text-muted-foreground">Could not load conversation.</p>
    );
  }

  const conversationResult = await getConversation(token, workspace.id, id);
  if (!conversationResult.success || !conversationResult.data?.conversation) {
    return (
      <p className="text-sm text-muted-foreground">
        {conversationResult.error ?? "Conversation not found."}
      </p>
    );
  }

  const conversation = conversationResult.data.conversation;
  const [runsResult, latestResult] = await Promise.all([
    listConversationRuns(token, workspace.id, id),
    getLatestConversationRun(token, workspace.id, id),
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
          href="/settings/conversations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Conversations
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
        conversationId={id}
        runs={runs}
        initialRun={latestRun}
      />
    </div>
  );
}
