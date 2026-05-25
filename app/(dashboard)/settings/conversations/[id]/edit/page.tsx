import Link from "next/link";

import { ConversationEditPageClient } from "@/components/settings/conversation-edit-page-client";
import { buttonVariants } from "@/components/ui/button";
import {
  getConversation,
  listAppContextOptions,
} from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

interface ConversationEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationEditPage({
  params,
}: ConversationEditPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;
  const token = await getAccessToken();

  if (!workspace?.id || !token) {
    return (
      <p className="text-sm text-muted-foreground">Could not load conversation.</p>
    );
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Only founders and admins can edit conversations.
      </p>
    );
  }

  const [conversationResult, rosterResult, appContextsResult] =
    await Promise.all([
      getConversation(token, workspace.id, id),
      listRosterMembers(token, workspace.id),
      listAppContextOptions(token, workspace.id),
    ]);

  if (!conversationResult.success || !conversationResult.data?.conversation) {
    return (
      <p className="text-sm text-muted-foreground">
        {conversationResult.error ?? "Conversation not found."}
      </p>
    );
  }

  const rosterMembers = rosterResult.data?.members ?? [];
  const appContextOptions = appContextsResult.data?.app_contexts ?? [];

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {conversationResult.data.conversation.name}
        </h1>
      </div>

      <ConversationEditPageClient
        conversation={conversationResult.data.conversation}
        workspaceId={workspace.id}
        rosterMembers={rosterMembers}
        appContextOptions={appContextOptions}
      />
    </div>
  );
}
