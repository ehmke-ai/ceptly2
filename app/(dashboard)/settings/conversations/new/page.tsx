import Link from "next/link";

import { ConversationCreateForm } from "@/components/settings/conversation-create-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import {
  listAppContextOptions,
  listConversationTemplates,
} from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { getWorkspaceTimezone } from "@/lib/api/conversations";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function NewConversationPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;
  const token = await getAccessToken();

  if (!canEdit || !workspace?.id || !token) {
    return (
      <p className="text-sm text-muted-foreground">
        Only founders and admins can create conversations.
      </p>
    );
  }

  const [templatesResult, rosterResult, timezoneResult, appContextsResult] =
    await Promise.all([
      listConversationTemplates(token, workspace.id),
      listRosterMembers(token, workspace.id),
      getWorkspaceTimezone(token, workspace.id),
      listAppContextOptions(token, workspace.id),
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <Link
          href="/settings/conversations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; Conversations
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add conversation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start from a template, then choose who receives check-in DMs. A
            short summary is generated automatically after you publish.
          </p>
        </div>
      </div>

      {templatesLoadFailed ? (
        <Alert variant="destructive">
          <AlertDescription>
            {templatesResult.error ??
              "Could not load templates from the API."}{" "}
            Showing the default Daily standup template offline — publish may fail
            until the backend is reachable.
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
      />
    </div>
  );
}
