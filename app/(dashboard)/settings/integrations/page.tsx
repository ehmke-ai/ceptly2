import { IntegrationsGrid } from "@/components/settings/integrations-grid";
import { listIntegrations } from "@/lib/api/integrations";
import { getAccessToken, requireAuth } from "@/lib/auth/server";

export default async function IntegrationsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const token = await getAccessToken();

  const result =
    workspace?.id && token
      ? await listIntegrations(token, workspace.id)
      : null;

  const integrations = result?.data?.integrations ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Ceptly to the tools your team already uses.
        </p>
      </div>

      {workspace?.id ? (
        result?.success ? (
          <IntegrationsGrid integrations={integrations} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {result?.error ?? "Could not load integrations."}
          </p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
