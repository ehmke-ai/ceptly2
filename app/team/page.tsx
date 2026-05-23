import Link from "next/link";

import { TeamRoster } from "@/components/team/team-roster";
import { buttonVariants } from "@/components/ui/button";
import { listRosterMembers } from "@/lib/api/roster";
import { getSlackConnectionStatus } from "@/lib/api/slack";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function TeamPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  const token = await getAccessToken();

  const slackStatusResult =
    workspace?.id && token
      ? await getSlackConnectionStatus(token, workspace.id)
      : null;

  const rosterResult =
    workspace?.id && token
      ? await listRosterMembers(token, workspace.id)
      : null;

  const slackStatus = slackStatusResult?.data ?? { connected: false };
  const rosterMembers = rosterResult?.data?.members ?? [];

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
          canEdit={canEdit}
          slackConnected={slackStatus.connected}
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
