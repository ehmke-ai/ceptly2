"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ThemeSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Switch between light and dark mode for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40",
                isDark ? "text-primary" : "text-muted-foreground",
              )}
            >
              {mounted && isDark ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode-toggle" className="text-sm font-medium">
                Dark mode
              </Label>
              <p className="text-sm text-muted-foreground">
                {mounted
                  ? isDark
                    ? "Dark theme is on"
                    : "Light theme is on"
                  : "Loading theme…"}
              </p>
            </div>
          </div>

          <button
            id="dark-mode-toggle"
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            disabled={!mounted}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              isDark ? "bg-primary" : "bg-input",
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                isDark ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
