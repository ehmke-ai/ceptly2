"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Unplug,
} from "lucide-react";

import {
  disconnectSlackConnection,
  fetchSlackInstallUrl,
} from "@/actions/slack";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SlackConnectionStatus } from "@/lib/api/slack";
import { cn } from "@/lib/utils";

interface SlackIntegrationPanelProps {
  workspaceId: string;
  canEdit: boolean;
  status: SlackConnectionStatus;
  description: string;
  showConnectedAlert?: boolean;
  showErrorAlert?: boolean;
}

function formatInstalledDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SlackIntegrationPanel({
  workspaceId,
  canEdit,
  status,
  description,
  showConnectedAlert = false,
  showErrorAlert = false,
}: SlackIntegrationPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  const installedLabel = formatInstalledDate(status.installedAt);
  const teamName = status.teamName ?? "Slack";

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchSlackInstallUrl(
        workspaceId,
        "/settings/integrations/slack",
      );
      if (result.error || !result.url) {
        setError(result.error ?? "Failed to start Slack install.");
        return;
      }
      window.location.href = result.url;
    });
  };

  const handleDisconnect = () => {
    setError(null);
    startDisconnectTransition(async () => {
      const result = await disconnectSlackConnection(workspaceId);
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
            Slack connected successfully. Add team members to the roster to
            start check-ins.
          </AlertDescription>
        </Alert>
      ) : null}

      {showErrorAlert ? (
        <Alert variant="destructive">
          <AlertDescription>
            Slack connection failed. Please try again.
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
                <p className="truncate font-medium">{teamName}</p>
                {installedLabel ? (
                  <p className="text-sm text-muted-foreground">
                    Connected {installedLabel}
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
                      Disconnect {teamName} workspace
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
            Install the Ceptly app in Slack to send check-in DMs to your team.
          </p>
          <Button type="button" onClick={handleConnect} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Add to Slack"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Slack is not connected. Ask a founder or admin to install Ceptly for
          your team.
        </p>
      )}
    </div>
  );
}
