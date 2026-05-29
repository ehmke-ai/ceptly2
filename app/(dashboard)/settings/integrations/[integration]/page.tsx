import Link from "next/link";
import { notFound } from "next/navigation";

import { DigestChannelForm } from "@/components/settings/digest-channel-form";
import { SlackRosterChatToggle } from "@/components/settings/slack-roster-chat-toggle";
import { JiraIntegrationPanel } from "@/components/settings/integrations/jira-integration-panel";
import { LinearIntegrationPanel } from "@/components/settings/integrations/linear-integration-panel";
import { SlackIntegrationPanel } from "@/components/settings/integrations/slack-integration-panel";
import { getDigestSlackChannel } from "@/lib/api/digest-channel";
import { buttonVariants } from "@/components/ui/button";
import { listIntegrations } from "@/lib/api/integrations";
import { resolveIntegration } from "@/lib/integrations/catalog";
import { getJiraConnectionStatus } from "@/lib/api/jira";
import { getLinearConnectionStatus } from "@/lib/api/linear";
import { getSlackConnectionStatus } from "@/lib/api/slack";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface IntegrationDetailPageProps {
  params: Promise<{ integration: string }>;
  searchParams: Promise<{ slack?: string; linear?: string; jira?: string }>;
}

export default async function IntegrationDetailPage({
  params,
  searchParams,
}: IntegrationDetailPageProps) {
  const user = await requireAuth();
  const { integration: integrationId } = await params;
  const query = await searchParams;

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;
  const token = await getAccessToken();

  const integrationsResult =
    workspace?.id && token ? await listIntegrations(token, workspace.id) : null;

  const integrationFromApi = integrationsResult?.data?.integrations.find(
    (item) => item.id === integrationId,
  );

  const integration = resolveIntegration(integrationId, integrationFromApi);

  if (!integration) {
    notFound();
  }

  const showSlackConnectedAlert = query.slack === "connected";
  const showSlackErrorAlert = query.slack === "error";
  const showLinearConnectedAlert = query.linear === "connected";
  const showLinearErrorAlert = query.linear === "error";
  const showJiraConnectedAlert = query.jira === "connected";
  const showJiraErrorAlert = query.jira === "error";

  let panel: React.ReactNode = null;

  if (integration.id === "slack" && workspace?.id && token) {
    const [slackStatusResult, digestResult] = await Promise.all([
      getSlackConnectionStatus(token, workspace.id),
      getDigestSlackChannel(token, workspace.id),
    ]);
    const slackStatus = slackStatusResult?.data ?? { connected: false };
    const digestChannelId = digestResult.data?.digest_slack_channel_id ?? null;

    panel = (
      <div className="space-y-10">
        <SlackIntegrationPanel
          workspaceId={workspace.id}
          canEdit={canEdit}
          status={slackStatus}
          description={integration.description}
          showConnectedAlert={showSlackConnectedAlert}
          showErrorAlert={showSlackErrorAlert}
        />
        {slackStatus.connected ? (
          <>
            <section className="space-y-4 border-t pt-8 dark:border-white/10">
              <div>
                <h2 className="text-sm font-semibold">Channel @mentions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Control who can @mention Ceptly in Slack channels.
                </p>
              </div>
              <SlackRosterChatToggle
                workspaceId={workspace.id}
                initialEnabled={slackStatus.rosterChatEnabled ?? false}
                canEdit={canEdit}
              />
            </section>
            <section className="space-y-4 border-t pt-8 dark:border-white/10">
              <div>
                <h2 className="text-sm font-semibold">
                  Leadership digest channel
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daily standup rollups, weekly digests, and blocker alerts post
                  here.
                </p>
              </div>
              <DigestChannelForm
                workspaceId={workspace.id}
                initialChannelId={digestChannelId}
                canEdit={canEdit}
              />
            </section>
          </>
        ) : null}
      </div>
    );
  }

  if (integration.id === "linear" && workspace?.id && token) {
    const linearStatusResult = await getLinearConnectionStatus(
      token,
      workspace.id,
    );
    const linearStatus = linearStatusResult?.data ?? { connected: false };

    panel = (
      <LinearIntegrationPanel
        workspaceId={workspace.id}
        canEdit={canEdit}
        status={linearStatus}
        description={integration.description}
        showConnectedAlert={showLinearConnectedAlert}
        showErrorAlert={showLinearErrorAlert}
      />
    );
  }

  if (integration.id === "jira" && workspace?.id && token) {
    const jiraStatusResult = await getJiraConnectionStatus(token, workspace.id);
    const jiraStatus = jiraStatusResult?.data ?? { connected: false };

    panel = (
      <JiraIntegrationPanel
        workspaceId={workspace.id}
        canEdit={canEdit}
        status={jiraStatus}
        description={integration.description}
        showConnectedAlert={showJiraConnectedAlert}
        showErrorAlert={showJiraErrorAlert}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/settings/integrations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Integrations
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {integration.name}
          </h1>
        </div>
      </div>

      {panel ?? (
        <p className="text-sm text-muted-foreground">
          This integration is not available yet.
        </p>
      )}
    </div>
  );
}
