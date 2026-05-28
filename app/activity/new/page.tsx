import Link from "next/link";

import { ConversationCreateForm } from "@/components/settings/conversation-create-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import {
  listAppContextOptions,
  listConversationTemplates,
  getWorkspaceTimezone,
} from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function NewActivityConversationPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
    redirect("/chat");
  }

  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;
  const token = await getAccessToken();

  if (!canEdit || !workspace?.id || !token) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Only workspace owners, admins, and members can create conversations.
      </p>
    );
  }

  const [
    templatesResult,
    rosterResult,
    timezoneResult,
    appContextsResult,
    slackChannelsResult,
  ] = await Promise.all([
    listConversationTemplates(token, workspace.id),
    listRosterMembers(token, workspace.id),
    getWorkspaceTimezone(token, workspace.id),
    listAppContextOptions(token, workspace.id),
    listSlackChannels(token, workspace.id),
  ]);

  const apiTemplates = templatesResult.data?.templates ?? [];
  const templates =
    apiTemplates.length > 0 ? apiTemplates : DEFAULT_CONVERSATION_TEMPLATES;
  const templatesLoadFailed = !templatesResult.success;
  const usedTemplateFallback =
    templatesResult.success && apiTemplates.length === 0;
  const rosterMembers = rosterResult.data?.members ?? [];
  const timezone = timezoneResult.data?.timezone ?? "America/Chicago";
  const appContextOptions = appContextsResult.data?.app_contexts ?? [];
  const slackChannels = slackChannelsResult.data?.channels ?? [];
  const slackChannelsError = slackChannelsResult.success
    ? null
    : (slackChannelsResult.error ??
      "Could not load Slack channels. You can still publish and add destinations when editing.");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/activity"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Activity
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add conversation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start from a template, choose who receives check-in DMs, and where
            standup rollups are posted. A short summary is generated
            automatically after you publish.
          </p>
        </div>
      </div>

      {templatesLoadFailed ? (
        <Alert variant="destructive">
          <AlertDescription>
            {templatesResult.error ?? "Could not load templates from the API."}{" "}
            Showing the default Daily standup template offline — publish may
            fail until the backend is reachable.
          </AlertDescription>
        </Alert>
      ) : usedTemplateFallback ? (
        <Alert>
          <AlertDescription>
            The API returned no templates. Using the built-in Daily standup
            template.
          </AlertDescription>
        </Alert>
      ) : null}

      <ConversationCreateForm
        workspaceId={workspace.id}
        workspaceTimezone={timezone}
        templates={templates}
        rosterMembers={rosterMembers}
        appContextOptions={appContextOptions}
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
      />
    </div>
  );
}
