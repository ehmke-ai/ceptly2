import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityAdhocList } from "@/components/activity/activity-adhoc-list";
import { ActivityAttentionList } from "@/components/activity/activity-attention-list";
import { ActivityConversationCard } from "@/components/activity/activity-conversation-card";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceActivity } from "@/lib/api/activity";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { isLeadershipRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function ActivityPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const role = workspace?.role;

  if (!isLeadershipRole(role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!workspace?.id || !token) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Could not load activity.
      </p>
    );
  }

  const activityResult = await getWorkspaceActivity(token, workspace.id);
  const activity = activityResult.data?.activity;

  if (!activityResult.success || !activity) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activityResult.error ?? "Could not load activity."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check-in results and items that need your attention.
        </p>
      </div>

      <ActivityAttentionList items={activity.attention_items} />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Scheduled check-ins</h2>
        {activity.scheduled_conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scheduled conversations yet.{" "}
            <Link
              href="/settings/conversations/new"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Add a conversation
            </Link>{" "}
            or{" "}
            <Link
              href="/chat"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              set one up in Chat
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {activity.scheduled_conversations.map((conversation) => (
              <ActivityConversationCard
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Recent reach-outs</h2>
        <ActivityAdhocList sessions={activity.adhoc_sessions} />
      </section>

      <div>
        <Link
          href="/settings/conversations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground hover:text-foreground",
          )}
        >
          Manage conversations in Settings
        </Link>
      </div>
    </div>
  );
}
