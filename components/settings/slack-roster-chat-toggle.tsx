"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateSlackRosterChatSetting } from "@/actions/slack-roster-chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SlackRosterChatToggleProps {
  workspaceId: string;
  initialEnabled: boolean;
  canEdit: boolean;
}

export function SlackRosterChatToggle({
  workspaceId,
  initialEnabled,
  canEdit,
}: SlackRosterChatToggleProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (!canEdit || isPending) {
      return;
    }

    const nextEnabled = !enabled;
    setError(null);
    setEnabled(nextEnabled);

    startTransition(async () => {
      const result = await updateSlackRosterChatSetting({
        workspaceId,
        rosterChatEnabled: nextEnabled,
      });

      if (result.error) {
        setEnabled(!nextEnabled);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="slack-roster-chat-toggle" className="text-sm font-medium">
            Allow roster members to @mention Ceptly
          </Label>
          <p className="text-sm text-muted-foreground">
            When enabled, anyone on the active team roster can @mention Ceptly
            in Slack channels and continue the conversation in the thread. They
            can ask about their own check-ins and assigned work. Workspace
            admins and leads always have access.
          </p>
        </div>

        <button
          id="slack-roster-chat-toggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Allow roster members to mention Ceptly in Slack"
          disabled={!canEdit || isPending}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            enabled ? "bg-primary" : "bg-input",
          )}
        >
          {isPending ? (
            <Loader2 className="absolute inset-0 m-auto size-3 animate-spin text-background" />
          ) : (
            <span
              className={cn(
                "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                enabled ? "translate-x-5" : "translate-x-0",
              )}
            />
          )}
        </button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
