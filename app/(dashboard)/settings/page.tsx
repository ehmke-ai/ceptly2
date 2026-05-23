import Link from "next/link";

import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { WorkspaceTimezoneForm } from "@/components/settings/workspace-timezone-form";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceTimezone } from "@/lib/api/conversations";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function SettingsPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  const token = await getAccessToken();
  const timezoneResult =
    workspace?.id && token
      ? await getWorkspaceTimezone(token, workspace.id)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team, integrations, and scheduled conversations.
          </p>
        </div>
      </div>

      {workspace?.id ? (
        <>
          <WorkspaceNameForm
            workspaceId={workspace.id}
            initialName={workspace.name}
            canEdit={canEdit}
          />

          {timezoneResult?.success && timezoneResult.data?.timezone ? (
            <WorkspaceTimezoneForm
              workspaceId={workspace.id}
              initialTimezone={timezoneResult.data.timezone}
              canEdit={canEdit}
            />
          ) : null}

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold">Integrations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect Slack and other tools your team uses.
            </p>
            <Link
              href="/settings/integrations"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Manage integrations
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold">Team roster</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage who receives scheduled check-in DMs in Slack.
            </p>
            <Link
              href="/team"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Manage roster
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold">Scheduled conversations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View your published check-in schedule. Edit it from the home page
              with AI.
            </p>
            <Link
              href="/settings/conversations"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Manage conversations
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
