import Link from "next/link";

import { WorkspaceInvites } from "@/components/settings/workspace-invites";
import { WorkspaceMembersTable } from "@/components/settings/workspace-members";
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { WorkspaceTimezoneForm } from "@/components/settings/workspace-timezone-form";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceTimezone } from "@/lib/api/conversations";
import { SeatUsageBanner } from "@/components/settings/seat-usage-banner";
import { fetchBillingStatus } from "@/lib/api/billing";
import { listInvites } from "@/lib/api/invites";
import { listWorkspaceMembers } from "@/lib/api/members";
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

  const invitesResult =
    workspace?.id && token
      ? await listInvites(token, workspace.id)
      : null;

  const pendingInvites = invitesResult?.data?.invites ?? [];

  const membersResult =
    workspace?.id && token
      ? await listWorkspaceMembers(token, workspace.id)
      : null;

  const members = membersResult?.data?.members ?? [];

  const billingStatus =
    workspace?.id && token
      ? await fetchBillingStatus(token, workspace.id)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team and integrations.
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

          <SeatUsageBanner
            billing={billingStatus}
            canManageBilling={canEdit}
          />

          <WorkspaceMembersTable
            workspaceId={workspace.id}
            canEdit={canEdit}
            currentUserId={user.id}
            members={members}
          />

          <WorkspaceInvites
            workspaceId={workspace.id}
            canEdit={canEdit}
            userEmail={user.email}
            invites={pendingInvites}
            billing={billingStatus}
          />

        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
