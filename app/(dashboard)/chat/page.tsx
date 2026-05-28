import { EmployeeChatPrompt } from "@/components/employee-chat-prompt";
import { listAppContextOptions } from "@/lib/api/conversations";
import { getLinearConnectionStatus } from "@/lib/api/linear";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function ChatPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;
  const token = await getAccessToken();

  const [
    linearStatusResult,
    appContextsResult,
    slackChannelsResult,
    rosterResult,
  ] =
    workspace?.id && token
      ? await Promise.all([
          getLinearConnectionStatus(token, workspace.id),
          listAppContextOptions(token, workspace.id),
          listSlackChannels(token, workspace.id),
          listRosterMembers(token, workspace.id),
        ])
      : [null, null, null, null];

  const linearConnected = linearStatusResult?.data?.connected ?? false;
  const appContextOptions = appContextsResult?.data?.app_contexts ?? [];
  const slackChannels = slackChannelsResult?.data?.channels ?? [];
  const slackChannelsError = slackChannelsResult?.success
    ? null
    : (slackChannelsResult?.error ?? null);
  const rosterMembers = rosterResult?.data?.members ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col">
        {workspace?.id ? (
          <EmployeeChatPrompt
            workspaceId={workspace.id}
            canEdit={canEdit}
            linearConnected={linearConnected}
            appContextOptions={appContextOptions}
            slackChannels={slackChannels}
            slackChannelsError={slackChannelsError}
            rosterMembers={rosterMembers}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to Ceptly
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No team found for your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
