import type { WorkspaceMembership } from "@/lib/api/types";

const ROLE_LABELS: Record<WorkspaceMembership["role"], string> = {
  founder: "Founder",
  admin: "Admin",
  lead: "Team lead",
  ic: "Individual contributor",
};

export function formatWorkspaceRole(role: WorkspaceMembership["role"]): string {
  return ROLE_LABELS[role];
}
