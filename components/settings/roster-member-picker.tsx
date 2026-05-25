"use client";

import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";

interface RosterMemberPickerProps {
  members: RosterMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function RosterMemberPicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
}: RosterMemberPickerProps) {
  const activeMembers = members.filter((member) => !member.paused);

  const toggle = (memberId: string) => {
    if (disabled) {
      return;
    }
    if (selectedIds.includes(memberId)) {
      if (selectedIds.length <= 1) {
        return;
      }
      onChange(selectedIds.filter((id) => id !== memberId));
      return;
    }
    onChange([...selectedIds, memberId]);
  };

  if (activeMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add team members to your roster before assigning them to a conversation.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Team members</Label>
      <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3 dark:border-white/10">
        {activeMembers.map((member) => {
          const checked = selectedIds.includes(member.id);
          return (
            <li key={member.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(member.id)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{member.display_name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {member.email}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
