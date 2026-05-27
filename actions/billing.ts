"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { refreshSubscriptionCookiesAction } from "@/actions/sync-subscription";
import {
  createBillingCheckout,
  createBillingPortalSession,
  updateSubscriptionSeats,
} from "@/lib/api/billing";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { getPrimaryWorkspace } from "@/lib/subscription";

export async function startBillingCheckoutAction(): Promise<{ error?: string }> {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    return { error: "Workspace not found" };
  }

  const result = await createBillingCheckout(token, workspace.id);

  if (result.error || !result.url) {
    return { error: result.error ?? "Unable to start checkout" };
  }

  redirect(result.url);
}

export async function openBillingPortalAction(): Promise<{ error?: string }> {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    return { error: "Workspace not found" };
  }

  const result = await createBillingPortalSession(token, workspace.id);

  if (result.error || !result.url) {
    return { error: result.error ?? "Unable to open billing portal" };
  }

  redirect(result.url);
}

export async function updateSubscriptionSeatsAction(
  quantity: number,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireAuth();
  const token = await getAccessToken();
  const workspace = getPrimaryWorkspace(user);

  if (!token || !workspace?.id) {
    return { error: "Workspace not found" };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Seat count must be at least 1" };
  }

  const result = await updateSubscriptionSeats(token, workspace.id, quantity);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/settings");
  revalidatePath("/settings/billing");

  return { success: true };
}

export { refreshSubscriptionCookiesAction };
