"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteStandupAction } from "@/actions/standups";
import { StandupForm } from "@/components/settings/standups/standup-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type { Standup } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";

interface StandupsSettingsProps {
  workspaceId: string;
  workspaceTimezone: string;
  standups: Standup[];
  rosterMembers: RosterMember[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  canEdit: boolean;
}

export function StandupsSettings({
  workspaceId,
  workspaceTimezone,
  standups: initialStandups,
  rosterMembers,
  slackChannels,
  slackChannelsError,
  canEdit,
}: StandupsSettingsProps) {
  const router = useRouter();
  const [standups, setStandups] = useState(initialStandups);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setStandups(initialStandups);
  }, [initialStandups]);
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();

  const editingStandup = standups.find((item) => item.id === editingId);

  const handleDelete = (standupId: string) => {
    if (!canEdit) {
      return;
    }
    setDeleteError(null);
    setDeletingId(standupId);
    startDeleteTransition(async () => {
      const result = await deleteStandupAction({ workspaceId, standupId });
      setDeletingId(null);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setStandups((current) => current.filter((item) => item.id !== standupId));
      if (editingId === standupId) {
        setEditingId(null);
      }
      router.refresh();
    });
  };

  const handleSaved = (savedStandup: Standup) => {
    setStandups((current) => {
      const index = current.findIndex((item) => item.id === savedStandup.id);
      if (index >= 0) {
        const next = [...current];
        next[index] = savedStandup;
        return next;
      }
      return [...current, savedStandup];
    });
    setCreating(false);
    setEditingId(null);
    router.refresh();
  };

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Channel standups are managed by your workspace admin.
      </p>
    );
  }

  if (creating) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">New channel standup</h2>
        <StandupForm
          workspaceId={workspaceId}
          workspaceTimezone={workspaceTimezone}
          rosterMembers={rosterMembers}
          slackChannels={slackChannels}
          slackChannelsError={slackChannelsError}
          onSaved={handleSaved}
          onCancel={() => setCreating(false)}
        />
      </div>
    );
  }

  if (editingStandup) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit {editingStandup.name}</h2>
        <StandupForm
          workspaceId={workspaceId}
          workspaceTimezone={workspaceTimezone}
          rosterMembers={rosterMembers}
          slackChannels={slackChannels}
          slackChannelsError={slackChannelsError}
          standup={editingStandup}
          onSaved={handleSaved}
          onCancel={() => setEditingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Run standups in Slack channels on a schedule. You can also set these up
          in{" "}
          <Link
            href="/chat"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Chat
          </Link>
          .
        </p>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" />
          Add standup
        </Button>
      </div>

      {deleteError ? (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      ) : null}

      {standups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No channel standups yet. Add one to post scheduled standups in Slack.
        </p>
      ) : (
        <div className="space-y-3">
          {standups.map((standup) => {
            const channelLabel = standup.slack_channel_name
              ? `#${standup.slack_channel_name}`
              : standup.slack_channel_id;
            const schedulePreview = formatSchedulePreview(
              standup.time_local,
              standup.timezone,
              standup.frequency,
              standup.days_of_week,
              standup.enabled,
            );

            return (
              <Card key={standup.id} className="dark:border-white/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-lg">{standup.name}</CardTitle>
                      <CardDescription>
                        {channelLabel} · {standup.members.length} participants ·{" "}
                        {schedulePreview}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${standup.name}`}
                        onClick={() => setEditingId(standup.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Delete ${standup.name}`}
                        disabled={deletingId === standup.id}
                        onClick={() => handleDelete(standup.id)}
                      >
                        {deletingId === standup.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
