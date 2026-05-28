import Link from "next/link";

import { TeamRoster } from "@/components/team/team-roster";
import { buttonVariants } from "@/components/ui/button";
import {
  getWorkspaceLanguage,
  getWorkspaceTimezone,
} from "@/lib/api/conversations";
import { getJiraConnectionStatus } from "@/lib/api/jira";
import { getLinearConnectionStatus } from "@/lib/api/linear";
import { listRosterMembers } from "@/lib/api/roster";
import { getSlackConnectionStatus } from "@/lib/api/slack";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function TeamPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

  const token = await getAccessToken();

  const [
    slackStatusResult,
    linearStatusResult,
    jiraStatusResult,
    rosterResult,
    timezoneResult,
    languageResult,
  ] =
    workspace?.id && token
      ? await Promise.all([
          getSlackConnectionStatus(token, workspace.id),
          getLinearConnectionStatus(token, workspace.id),
          getJiraConnectionStatus(token, workspace.id),
          listRosterMembers(token, workspace.id),
          getWorkspaceTimezone(token, workspace.id),
          getWorkspaceLanguage(token, workspace.id),
        ])
      : [null, null, null, null, null, null];

  const slackStatus = slackStatusResult?.data ?? { connected: false };
  const linearStatus = linearStatusResult?.data ?? { connected: false };
  const jiraStatus = jiraStatusResult?.data ?? { connected: false };
  const rosterMembers = rosterResult?.data?.members ?? [];
  const workspaceTimezone = timezoneResult?.data?.timezone ?? "America/Chicago";
  const workspaceLanguage = languageResult?.data?.language ?? "en";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team roster</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People on this list receive scheduled check-in DMs in Slack.
          </p>
        </div>
      </div>

      {workspace?.id ? (
        <TeamRoster
          workspaceId={workspace.id}
          workspaceTimezone={workspaceTimezone}
          workspaceLanguage={workspaceLanguage}
          canEdit={canEdit}
          slackConnected={slackStatus.connected}
          linearConnected={linearStatus.connected}
          jiraConnected={jiraStatus.connected}
          members={rosterMembers}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
