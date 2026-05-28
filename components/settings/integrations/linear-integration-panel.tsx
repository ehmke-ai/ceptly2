"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, Unplug } from "lucide-react";

import {
  disconnectLinearConnection,
  fetchLinearInstallUrl,
} from "@/actions/linear";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LinearConnectionStatus } from "@/lib/api/linear";
import { cn } from "@/lib/utils";

interface LinearIntegrationPanelProps {
  workspaceId: string;
  canEdit: boolean;
  status: LinearConnectionStatus;
  description: string;
  showConnectedAlert?: boolean;
  showErrorAlert?: boolean;
}

function formatConnectedDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function LinearIntegrationPanel({
  workspaceId,
  canEdit,
  status,
  description,
  showConnectedAlert = false,
  showErrorAlert = false,
}: LinearIntegrationPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  const connectedLabel = formatConnectedDate(status.connectedAt);
  const organizationName = status.organizationName ?? "Linear";

  const connectedHint = status.connected
    ? "Standup agents can link tickets and update status when your team says they finished or started work. If status updates fail, disconnect and reconnect Linear to grant write access."
    : null;

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchLinearInstallUrl(
        workspaceId,
        "/settings/integrations/linear",
      );
      if (result.error || !result.url) {
        setError(result.error ?? "Failed to start Linear authorization.");
        return;
      }
      window.location.href = result.url;
    });
  };

  const handleDisconnect = () => {
    setError(null);
    startDisconnectTransition(async () => {
      const result = await disconnectLinearConnection(workspaceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{description}</p>

      {showConnectedAlert ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Linear connected successfully. Team insights chat can now reference
            assigned issues alongside check-in responses.
          </AlertDescription>
        </Alert>
      ) : null}

      {showErrorAlert ? (
        <Alert variant="destructive">
          <AlertDescription>
            Linear connection failed. Please try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {status.connected ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Connected workspaces</h2>
          <div className="rounded-lg border border-border bg-card dark:border-white/10">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{organizationName}</p>
                {connectedLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Connected {connectedLabel}
                  </p>
                ) : null}
                {connectedHint ? (
                  <p className="text-sm text-muted-foreground">
                    {connectedHint}
                  </p>
                ) : null}
              </div>

              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2"
                        disabled={isDisconnecting}
                      />
                    }
                  >
                    <span className="size-2 rounded-full bg-green-500" />
                    Connected
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Unplug />
                      )}
                      Disconnect {organizationName} workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm",
                  )}
                >
                  <span className="size-2 rounded-full bg-green-500" />
                  Connected
                </div>
              )}
            </div>
          </div>
        </div>
      ) : canEdit ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Authorize Ceptly to read Linear issues so chat can answer questions
            about what your team is working on.
          </p>
          <Button type="button" onClick={handleConnect} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Connect Linear"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Linear is not connected. Ask a workspace owner or admin to connect
          Linear for your team.
        </p>
      )}
    </div>
  );
}
