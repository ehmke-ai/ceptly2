"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";

import { fetchSlackInstallUrl } from "@/actions/slack";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SlackConnectionStatus } from "@/lib/api/slack";

interface SlackConnectionCardProps {
  workspaceId: string;
  canEdit: boolean;
  status: SlackConnectionStatus;
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

export function SlackConnectionCard({
  workspaceId,
  canEdit,
  status,
  showConnectedAlert = false,
  showErrorAlert = false,
}: SlackConnectionCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const installedLabel = formatInstalledDate(status.installedAt);

  const handleConnect = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchSlackInstallUrl(workspaceId, "/settings");
      if (result.error || !result.url) {
        setError(result.error ?? "Failed to start Slack install.");
        return;
      }
      window.location.href = result.url;
    });
  };

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Slack
        </CardTitle>
        <CardDescription>
          Connect Ceptly to Slack so check-ins run in DMs for your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showConnectedAlert ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Slack connected successfully. Add team members to the roster below
              to start check-ins.
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
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Connected to {status.teamName ?? "Slack"}
            </p>
            {installedLabel ? (
              <p className="text-sm text-muted-foreground">
                Installed on {installedLabel}
              </p>
            ) : null}
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
      </CardContent>
    </Card>
  );
}
