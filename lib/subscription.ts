import type { AuthUser, WorkspaceMembership } from "@/lib/api/types";

const BILLING_ADMIN_ROLES = new Set<WorkspaceMembership["role"]>([
  "founder",
  "admin",
]);

export function isBillingEnforced(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENFORCED !== "false";
}

export function getPrimaryWorkspace(
  user: AuthUser | null | undefined,
): WorkspaceMembership | undefined {
  return user?.workspaces?.[0];
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<
  NonNullable<WorkspaceMembership["subscriptionStatus"]>
>(["trialing", "active", "past_due"]);

export function workspaceHasActiveSubscription(
  workspace: WorkspaceMembership | undefined,
): boolean {
  if (!workspace) {
    return false;
  }

  if (workspace.hasActiveSubscription !== undefined) {
    return workspace.hasActiveSubscription;
  }

  if (workspace.subscriptionStatus !== undefined) {
    return ACTIVE_SUBSCRIPTION_STATUSES.has(workspace.subscriptionStatus);
  }

  return false;
}

export function userCanManageBilling(
  workspace: WorkspaceMembership | undefined,
): boolean {
  return Boolean(workspace && BILLING_ADMIN_ROLES.has(workspace.role));
}

export function userNeedsSubscribe(user: AuthUser | null | undefined): boolean {
  if (!isBillingEnforced()) {
    return false;
  }

  const workspace = getPrimaryWorkspace(user);
  if (!workspace || !userCanManageBilling(workspace)) {
    return false;
  }

  return !workspaceHasActiveSubscription(workspace);
}

export function userBlockedBySubscription(
  user: AuthUser | null | undefined,
): boolean {
  if (!isBillingEnforced()) {
    return false;
  }

  const workspace = getPrimaryWorkspace(user);
  if (!workspace) {
    return false;
  }

  return !workspaceHasActiveSubscription(workspace);
}

export function formatSubscriptionStatus(
  status: WorkspaceMembership["subscriptionStatus"],
): string {
  switch (status) {
    case "trialing":
      return "Free trial";
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Incomplete";
    default:
      return "Not subscribed";
  }
}
