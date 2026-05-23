"use client";

import { useActionState, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";

import {
  addRosterMemberAction,
  removeRosterMemberAction,
  toggleRosterMemberPaused,
} from "@/actions/roster";
import { RosterDataTable } from "@/components/team/roster-data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";

interface TeamRosterProps {
  workspaceId: string;
  canEdit: boolean;
  slackConnected: boolean;
  members: RosterMember[];
}

export function TeamRoster({
  workspaceId,
  canEdit,
  slackConnected,
  members,
}: TeamRosterProps) {
  const [addState, addAction, addPending] = useActionState(
    addRosterMemberAction,
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTogglePaused = (member: RosterMember) => {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleRosterMemberPaused(
        workspaceId,
        member.id,
        !member.paused,
      );
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleRemove = (memberId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await removeRosterMemberAction(workspaceId, memberId);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const columns: ColumnDef<RosterMember>[] = [
    {
      accessorKey: "display_name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("display_name")}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.paused ? (
          <Badge variant="secondary">Paused</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        ),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }: { row: { original: RosterMember } }) => {
              const member = row.original;

              return (
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending || !slackConnected}
                    onClick={() => handleTogglePaused(member)}
                    aria-label={
                      member.paused
                        ? `Resume check-ins for ${member.display_name}`
                        : `Pause check-ins for ${member.display_name}`
                    }
                  >
                    {member.paused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending || !slackConnected}
                    onClick={() => handleRemove(member.id)}
                    aria-label={`Remove ${member.display_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            },
          } satisfies ColumnDef<RosterMember>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {!slackConnected ? (
        <Alert>
          <AlertDescription>
            Connect Slack in team settings before adding members to the roster.
          </AlertDescription>
        </Alert>
      ) : slackConnected && members.length === 0 ? (
        <Alert>
          <AlertDescription>
            Add team members to receive check-ins.
          </AlertDescription>
        </Alert>
      ) : null}

      {addState.error ? (
        <Alert variant="destructive">
          <AlertDescription>{addState.error}</AlertDescription>
        </Alert>
      ) : null}

      {addState.success ? (
        <Alert>
          <AlertDescription>Team member added.</AlertDescription>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <RosterDataTable columns={columns} data={members} />

      {canEdit ? (
        <form action={addAction} className="space-y-3">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="space-y-2">
            <Label htmlFor="roster-email">Add by email</Label>
            <div className="flex gap-2">
              <Input
                id="roster-email"
                name="email"
                type="email"
                placeholder="teammate@company.com"
                required
                disabled={!slackConnected || addPending}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!slackConnected || addPending}
              >
                {addPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must match a Slack account in your connected team.
            </p>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only founders and admins can manage the team roster.
        </p>
      )}
    </div>
  );
}
