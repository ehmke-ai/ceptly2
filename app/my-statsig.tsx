"use client";

import { useMemo } from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";

import type { AuthUser } from "@/lib/api/types";

const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

function isValidStatsigKey(key: string | undefined): key is string {
  return typeof key === "string" && key.startsWith("client-");
}

function toStatsigUser(authUser: AuthUser | null | undefined) {
  if (authUser) {
    return {
      userID: authUser.id,
      email: authUser.email,
      custom: authUser.fullName ? { fullName: authUser.fullName } : undefined,
    };
  }

  return { userID: "anonymous" };
}

export default function MyStatsig({
  children,
  authUser,
}: {
  children: React.ReactNode;
  authUser?: AuthUser | null;
}) {
  const plugins = useMemo(
    () => [
      new StatsigAutoCapturePlugin({
        consoleLogAutoCaptureSettings: {
          enabled: true,
        },
      }),
      new StatsigSessionReplayPlugin(),
    ],
    [],
  );

  const user = useMemo(() => toStatsigUser(authUser), [authUser]);

  if (!isValidStatsigKey(sdkKey)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Statsig] NEXT_PUBLIC_STATSIG_CLIENT_KEY is missing or invalid. Analytics disabled.",
      );
    }
    return children;
  }

  return (
    <StatsigProvider
      sdkKey={sdkKey}
      user={user}
      options={{
        plugins,
        logLevel:
          process.env.NODE_ENV === "development"
            ? LogLevel.Debug
            : LogLevel.Warn,
      }}
    >
      {children}
    </StatsigProvider>
  );
}
