import { ConversationList } from "@/components/settings/conversation-list";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { listConversations } from "@/lib/api/conversations";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function ConversationsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  const token = await getAccessToken();
  const result =
    workspace?.id && token
      ? await listConversations(token, workspace.id, true)
      : null;

  const conversations = result?.data?.conversations ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Conversations</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Scheduled conversations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your published check-in schedule, or describe changes on the
            home page and publish a new plan with AI.
          </p>
        </div>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Edit with AI
        </Link>
      </div>

      {result?.success && workspace?.id ? (
        <ConversationList
          conversations={conversations}
          workspaceId={workspace.id}
          canEdit={canEdit}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {result?.error ?? "Could not load conversations."}
        </p>
      )}
    </div>
  );
}
