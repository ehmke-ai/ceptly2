"use client";

import React from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";

export default function MyStatsig({ children }: { children: React.ReactNode }) {
  const id = typeof userID !== "undefined" ? userID : "a-user";

  const user = {
    userID: id,
    // Optional additional fields:
    // email: 'user@example.com',
    // customIDs: { internalID: 'internal-123' },
    // custom: { plan: 'premium' }
  };

  return (
    <StatsigProvider
      sdkKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!}
      user={user}
      options={{ logLevel: LogLevel.Debug }}
    >
      {children}
    </StatsigProvider>
  );
}
