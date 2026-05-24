"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, Loader2, Mail, Trash2 } from "lucide-react";

import { createInviteAction, revokeInviteAction } from "@/actions/invites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceInvite } from "@/lib/api/types";

interface WorkspaceInvitesProps {
  workspaceId: string;
  canEdit: boolean;
  userEmail: string;
  invites: WorkspaceInvite[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WorkspaceInvites({
  workspaceId,
  canEdit,
  userEmail,
  invites,
}: WorkspaceInvitesProps) {
  const [createState, createAction, createPending] = useActionState(
    createInviteAction,
    {},
  );
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyLink = async (invite: WorkspaceInvite) => {
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopiedInviteId(invite.id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch {
      setActionError("Could not copy link. Please copy it manually.");
    }
  };

  const handleRevoke = (inviteId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await revokeInviteAction(workspaceId, inviteId);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
      <h2 className="text-base font-semibold">Invite teammates</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite people to join your Ceptly workspace. Share the invite link with
        them directly.
      </p>

      {canEdit ? (
        <form action={createAction} className="mt-4 space-y-3">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" disabled={createPending}>
                {createPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send invite"
                )}
              </Button>
            </div>
          </div>
          {createState.error ? (
            <p className="text-sm text-destructive">{createState.error}</p>
          ) : null}
          {createState.success && createState.inviteUrl ? (
            <Alert>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Invite created. Copy the link to share it.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void navigator.clipboard.writeText(createState.inviteUrl!)
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Only workspace admins can send invites.
        </p>
      )}

      {actionError ? (
        <p className="mt-3 text-sm text-destructive">{actionError}</p>
      ) : null}

      {invites.length > 0 ? (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Pending invites</h3>
          <ul className="divide-y divide-border rounded-md border border-border">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(invite.createdAt)} · Expires{" "}
                    {formatDate(invite.expiresAt)}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyLink(invite)}
                    >
                      {copiedInviteId === invite.id ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(invite.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : canEdit ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No pending invites yet.
        </p>
      ) : null}

      {canEdit && userEmail ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Invites must be accepted with the invited email address.
        </p>
      ) : null}
    </div>
  );
}
