import type { WorkspaceMembership } from "@/lib/api/types";

const ROLE_LABELS: Record<WorkspaceMembership["role"], string> = {
  founder: "Founder",
  admin: "Admin",
  lead: "Team lead",
  ic: "Individual contributor",
};

export const LEADERSHIP_ROLES = new Set<WorkspaceMembership["role"]>([
  "founder",
  "admin",
  "lead",
]);

export function isLeadershipRole(
  role: WorkspaceMembership["role"] | undefined,
): boolean {
  return role ? LEADERSHIP_ROLES.has(role) : false;
}

export function formatWorkspaceRole(role: WorkspaceMembership["role"]): string {
  return ROLE_LABELS[role];
}
