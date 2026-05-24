"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

import type { AgentActivityState } from "@/lib/api/workspace-chat-stream";
import { getIntegrationLogo } from "@/lib/integrations/logos";
import { cn } from "@/lib/utils";

interface AgentActivityFeedProps {
  activity: AgentActivityState;
  isLive?: boolean;
  className?: string;
}

function formatElapsedSeconds(startedAt: number, now: number): number {
  return Math.max(1, Math.floor((now - startedAt) / 1000));
}

export function AgentActivityFeed({
  activity,
  isLive = false,
  className,
}: AgentActivityFeedProps) {
  const { resolvedTheme } = useTheme();
  const logoTheme = resolvedTheme === "dark" ? "dark" : "light";
  const [frozenNow] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const isActive = isLive && activity.completedAt === undefined;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isActive]);

  const elapsed = useMemo(() => {
    const endTime = activity.completedAt ?? (isActive ? now : frozenNow);
    return formatElapsedSeconds(activity.startedAt, endTime);
  }, [activity.completedAt, activity.startedAt, frozenNow, isActive, now]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isActive ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : null}
        <span>
          {activity.statusLabel} • {elapsed}s
        </span>
      </div>

      {activity.tools.length > 0 ? (
        <div className="flex flex-col gap-3 pl-6">
          {activity.tools.map((tool) => {
            const logo = getIntegrationLogo(tool.integration, logoTheme);

            return (
              <div
                key={tool.id}
                className={cn(
                  "flex flex-col gap-1",
                  tool.status === "success" && "opacity-70",
                  tool.status === "error" && "opacity-80",
                )}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt=""
                      className="size-4 shrink-0 rounded-sm object-contain"
                    />
                  ) : tool.integration === "ceptly" ? (
                    <Sparkles className="size-4 shrink-0 text-primary" />
                  ) : (
                    <span className="size-4 shrink-0 rounded-sm bg-muted" />
                  )}
                  <span>{tool.label}</span>
                </div>
                {tool.args_preview ? (
                  <p className="pl-6 font-mono text-sm text-foreground">
                    {tool.args_preview}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
