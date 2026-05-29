import { Suspense } from "react";
import { redirect } from "next/navigation";

import { StandupsSettings } from "@/components/settings/standups/standups-settings";
import { getWorkspaceTimezone, listAppContextOptions } from "@/lib/api/conversations";
import { listStandups } from "@/lib/api/standups";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function StandupsSettingsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!workspace?.id) {
    redirect("/settings");
  }

  if (!canManageWorkspace(workspace.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const [standupsResult, rosterResult, channelsResult, timezoneResult, appContextsResult] =
    await Promise.all([
      listStandups(token, workspace.id),
      listRosterMembers(token, workspace.id),
      listSlackChannels(token, workspace.id),
      getWorkspaceTimezone(token, workspace.id),
      listAppContextOptions(token, workspace.id),
    ]);

  const standups = standupsResult.data?.standups ?? [];
  const rosterMembers = rosterResult.data?.members ?? [];
  const slackChannels = channelsResult.data?.channels ?? [];
  const appContextOptions = appContextsResult.data?.app_contexts ?? [];
  const workspaceTimezone =
    timezoneResult.data?.timezone ?? "America/Chicago";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Channel standups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduled standups that run in Slack channels with your roster.
        </p>
      </div>

      {!standupsResult.success ? (
        <p className="text-sm text-muted-foreground">
          {standupsResult.error ?? "Could not load standups."}
        </p>
      ) : (
        <Suspense fallback={null}>
          <StandupsSettings
            workspaceId={workspace.id}
            workspaceTimezone={workspaceTimezone}
            standups={standups}
            rosterMembers={rosterMembers}
            slackChannels={slackChannels}
            appContextOptions={appContextOptions}
            slackChannelsError={
              channelsResult.success ? null : channelsResult.error
            }
            canEdit
          />
        </Suspense>
      )}
    </div>
  );
}
