import { ConversationList } from "@/components/settings/conversation-list";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { listConversations } from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function ConversationsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  const token = await getAccessToken();
  const [conversationsResult, rosterResult] =
    workspace?.id && token
      ? await Promise.all([
          listConversations(token, workspace.id, { includeMembers: true }),
          listRosterMembers(token, workspace.id),
        ])
      : [null, null];

  const conversations = conversationsResult?.data?.conversations ?? [];
  const rosterMembers = rosterResult?.data?.members ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Scheduled conversations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your published check-in schedule, or describe changes on the
            home page and publish a new plan with AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Link
              href="/settings/conversations/new"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Add conversation
            </Link>
          ) : null}
          <Link
            href="/chat"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit with AI
          </Link>
        </div>
      </div>

      {conversationsResult?.success && workspace?.id ? (
        <ConversationList
          conversations={conversations}
          workspaceId={workspace.id}
          rosterMembers={rosterMembers}
          canEdit={canEdit}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {conversationsResult?.error ?? "Could not load conversations."}
        </p>
      )}
    </div>
  );
}
