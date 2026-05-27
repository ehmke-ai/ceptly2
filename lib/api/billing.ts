export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export interface WorkspaceBillingStatus {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasActiveSubscription: boolean;
  seatUsage: number;
  paidSeats: number;
  seatsAvailable: number;
  pricePerSeatCents: number | null;
}

export interface BillingCheckoutResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

export interface BillingPortalResponse {
  success: boolean;
  data?: { url: string };
  error?: string;
}

export interface BillingStatusResponse {
  success: boolean;
  data?: WorkspaceBillingStatus;
  error?: string;
}

function billingBase(workspaceId: string) {
  return `/api/workspaces/${workspaceId}/billing`;
}

export async function fetchBillingStatus(
  token: string,
  workspaceId: string,
): Promise<WorkspaceBillingStatus | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }

  const response = await fetch(`${base}${billingBase(workspaceId)}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as BillingStatusResponse;
  return result.success ? (result.data ?? null) : null;
}

export async function createBillingCheckout(
  token: string,
  workspaceId: string,
): Promise<{ url?: string; error?: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return { error: "API is not configured" };
  }

  const response = await fetch(`${base}${billingBase(workspaceId)}/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as BillingCheckoutResponse;
  if (!response.ok || !result.success) {
    return { error: result.error ?? "Failed to start checkout" };
  }

  return { url: result.data?.url };
}

export async function createBillingPortalSession(
  token: string,
  workspaceId: string,
): Promise<{ url?: string; error?: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return { error: "API is not configured" };
  }

  const response = await fetch(`${base}${billingBase(workspaceId)}/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as BillingPortalResponse;
  if (!response.ok || !result.success) {
    return { error: result.error ?? "Failed to open billing portal" };
  }

  return { url: result.data?.url };
}

export interface UpdateSeatsResponse {
  success: boolean;
  data?: WorkspaceBillingStatus;
  error?: string;
}

export async function updateSubscriptionSeats(
  token: string,
  workspaceId: string,
  quantity: number,
): Promise<{ data?: WorkspaceBillingStatus; error?: string }> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return { error: "API is not configured" };
  }

  const response = await fetch(`${base}${billingBase(workspaceId)}/seats`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity }),
  });

  const result = (await response.json()) as UpdateSeatsResponse;
  if (!response.ok || !result.success) {
    return { error: result.error ?? "Failed to update seats" };
  }

  return { data: result.data };
}

export function formatPricePerSeat(cents: number | null | undefined): string {
  if (cents == null) {
    return "$20";
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
