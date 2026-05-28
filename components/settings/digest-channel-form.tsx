"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateDigestChannel } from "@/actions/digest-channel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DigestChannelFormProps {
  workspaceId: string;
  initialChannelId: string | null;
  canEdit: boolean;
}

export function DigestChannelForm({
  workspaceId,
  initialChannelId,
  canEdit,
}: DigestChannelFormProps) {
  const router = useRouter();
  const [channelId, setChannelId] = useState(initialChannelId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateDigestChannel({
        workspaceId,
        digestSlackChannelId: channelId.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="digest-channel-id">Leadership digest channel ID</Label>
        <Input
          id="digest-channel-id"
          value={channelId}
          onChange={(event) => setChannelId(event.target.value)}
          placeholder="C0123456789"
          disabled={!canEdit || isPending}
        />
        <p className="text-sm text-muted-foreground">
          Slack channel ID for daily standup rollups, weekly digests, and
          blocker alerts. In Slack, open the channel → channel details → copy
          the channel ID at the bottom.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {canEdit ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save digest channel"
          )}
        </Button>
      ) : null}
    </form>
  );
}
