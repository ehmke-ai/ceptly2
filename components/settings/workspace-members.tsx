"use client";

import { useRef, useState, useTransition } from "react";
import { Ellipsis, Loader2, Trash2 } from "lucide-react";

import {
  removeMemberAction,
  transferOwnershipAction,
  updateMemberRoleAction,
} from "@/actions/members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkspaceMember } from "@/lib/api/types";
import { formatWorkspaceRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const EDITABLE_ROLES = ["admin", "member"] as const;

interface WorkspaceMembersProps {
  workspaceId: string;
  canEdit: boolean;
  currentUserId: string;
  currentUserRole: WorkspaceMember["role"];
  members: WorkspaceMember[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(member: WorkspaceMember): string {
  return member.full_name?.trim() || member.email.split("@")[0] || member.email;
}

export function WorkspaceMembersTable({
  workspaceId,
  canEdit,
  currentUserId,
  currentUserRole,
  members,
}: WorkspaceMembersProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isWorkspaceOwner = currentUserRole === "owner";

  const handleRoleChange = (userId: string, role: "admin" | "member") => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateMemberRoleAction(workspaceId, userId, role);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleRoleSelect = (member: WorkspaceMember, value: string) => {
    if (value === "owner") {
      if (!isWorkspaceOwner || member.role !== "admin") {
        return;
      }
      setPendingTransfer({
        userId: member.user_id,
        name: displayName(member),
      });
      dialogRef.current?.showModal();
      return;
    }

    handleRoleChange(member.user_id, value as "admin" | "member");
  };

  const handleRemove = (userId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, userId);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const closeTransferDialog = () => {
    setPendingTransfer(null);
    dialogRef.current?.close();
  };

  const confirmTransferOwnership = () => {
    if (!pendingTransfer) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const result = await transferOwnershipAction(
        workspaceId,
        pendingTransfer.userId,
      );
      if (result.error) {
        setActionError(result.error);
        return;
      }
      closeTransferDialog();
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Workspace members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          People with access to this workspace. Workspace owners and admins use
          a paid seat; members have full product access without billing.
        </p>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canEdit ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length ? (
              members.map((member) => {
                const isSelf = member.user_id === currentUserId;
                const isOwner = member.role === "owner";
                const canManageMember =
                  canEdit && !isSelf && !isOwner && !isPending;
                const canOfferOwnership =
                  isWorkspaceOwner && member.role === "admin" && !isSelf;

                return (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {displayName(member)}
                        </span>
                        {isSelf ? (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      {canManageMember ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleSelect(member, e.target.value)
                          }
                          disabled={isPending}
                          className={cn(
                            "h-9 rounded-md border border-input bg-background px-3 text-sm",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          )}
                        >
                          {EDITABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {formatWorkspaceRole(role)}
                            </option>
                          ))}
                          {canOfferOwnership ? (
                            <option value="owner">
                              {formatWorkspaceRole("owner")}
                            </option>
                          ) : null}
                        </select>
                      ) : (
                        formatWorkspaceRole(member.role)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </TableCell>
                    {canEdit ? (
                      <TableCell>
                        {canManageMember ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground"
                                  disabled={isPending}
                                  aria-label={`Actions for ${displayName(member)}`}
                                />
                              }
                            >
                              {isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Ellipsis className="size-4" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleRemove(member.user_id)}
                              >
                                <Trash2 />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 5 : 4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No workspace members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isWorkspaceOwner ? (
        <dialog
          ref={dialogRef}
          className="fixed top-1/2 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-0 shadow-2xl open:flex open:flex-col [&::backdrop]:bg-black/60"
          onClose={() => setPendingTransfer(null)}
        >
          <form
            method="dialog"
            className="flex flex-col"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Transfer ownership</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Are you sure you want to make{" "}
                <span className="font-medium text-foreground">
                  {pendingTransfer?.name}
                </span>{" "}
                the workspace owner? You will become an admin.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={closeTransferDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending || !pendingTransfer}
                onClick={confirmTransferOwnership}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Make owner"
                )}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </section>
  );
}
