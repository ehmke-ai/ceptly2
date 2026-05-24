"use client";

import { useEffect } from "react";

import { refreshSubscriptionCookiesAction } from "@/actions/sync-subscription";

export function SyncSubscriptionCookies() {
  useEffect(() => {
    void refreshSubscriptionCookiesAction();
  }, []);

  return null;
}
