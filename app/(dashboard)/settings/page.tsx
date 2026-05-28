import { WorkspaceInvites } from "@/components/settings/workspace-invites";
import { WorkspaceLanguageForm } from "@/components/settings/workspace-language-form";
import { WorkspaceMembersTable } from "@/components/settings/workspace-members";
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { WorkspaceTimezoneForm } from "@/components/settings/workspace-timezone-form";
import { fetchBillingStatus } from "@/lib/api/billing";
import { getWorkspaceLanguage, getWorkspaceTimezone } from "@/lib/api/conversations";
import { listInvites } from "@/lib/api/invites";
import { listWorkspaceMembers } from "@/lib/api/members";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function SettingsPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

  const token = await getAccessToken();

  const [
    timezoneResult,
    languageResult,
    invitesResult,
    membersResult,
    billingStatus,
  ] =
    workspace?.id && token
      ? await Promise.all([
          getWorkspaceTimezone(token, workspace.id),
          getWorkspaceLanguage(token, workspace.id),
          listInvites(token, workspace.id),
          listWorkspaceMembers(token, workspace.id),
          fetchBillingStatus(token, workspace.id),
        ])
      : [null, null, null, null, null];

  const pendingInvites = invitesResult?.data?.invites ?? [];
  const members = membersResult?.data?.members ?? [];

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

          {languageResult?.success && languageResult.data?.language ? (
            <WorkspaceLanguageForm
              workspaceId={workspace.id}
              initialLanguage={languageResult.data.language}
              canEdit={canEdit}
            />
          ) : null}

          <WorkspaceMembersTable
            workspaceId={workspace.id}
            canEdit={canEdit}
            currentUserId={user.id}
            currentUserRole={workspace.role}
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
