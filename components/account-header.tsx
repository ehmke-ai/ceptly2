"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useStatsigClient } from "@statsig/react-bindings";

import { fetchActivityAttentionCount } from "@/actions/activity";
import { signOut } from "@/actions/auth";
import type { AuthUser } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

const baseNavigationItems = [
  { label: "Chat", path: "/chat" },
  { label: "Activity", path: "/activity", leadershipOnly: true },
  { label: "Team", path: "/team" },
  { label: "Settings", path: "/settings", matchPrefix: "/settings" },
];

function getInitials(user: AuthUser) {
  const name = user.fullName?.trim() || user.email;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function getDisplayName(user: AuthUser) {
  return user.fullName?.trim() || user.email;
}

interface AccountHeaderProps {
  user: AuthUser;
}

export function AccountHeader({ user }: AccountHeaderProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { client } = useStatsigClient();
  const [mounted, setMounted] = useState(false);
  const [attentionCount, setAttentionCount] = useState(0);

  const workspace = user.workspaces?.[0];
  const showActivity = canManageWorkspace(workspace?.role);
  const navigationItems = baseNavigationItems.filter(
    (item) => !item.leadershipOnly || showActivity,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showActivity || !workspace?.id) {
      return;
    }

    void fetchActivityAttentionCount({ workspaceId: workspace.id }).then(
      setAttentionCount,
    );
  }, [showActivity, workspace?.id]);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const handleSignOut = () => {
    client.logEvent("sign_out_click");
    void signOut();
  };

  const workspaceName = user.workspaces?.[0]?.name ?? "My Team";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                prefetch
                className="cursor-pointer"
                onClick={() => client.logEvent("logo_click")}
              >
                <Image
                  src={
                    mounted && (resolvedTheme ?? theme) === "light"
                      ? "/parallax.png"
                      : "/parallax-dark.png"
                  }
                  alt="Ceptly Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
              </Link>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                href="/settings"
                prefetch
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                onClick={() => client.logEvent("workspace_nav_click")}
              >
                {workspaceName}
              </Link>
              {navigationItems.map((item) => {
                const active = pathname.startsWith(
                  item.matchPrefix ?? item.path,
                );

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch
                    className={cn(
                      buttonVariants({
                        variant: active ? "default" : "ghost",
                        size: "sm",
                      }),
                      "relative",
                    )}
                    onClick={() =>
                      client.logEvent("navigation_click", item.path)
                    }
                  >
                    {item.label}
                    {item.path === "/activity" && attentionCount > 0 ? (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                      >
                        {attentionCount > 9 ? "9+" : attentionCount}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="relative size-9 rounded-full p-0"
                  />
                }
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {getDisplayName(user)}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link
                      href="/settings/account"
                      prefetch
                      onClick={() => client.logEvent("account_settings_click")}
                    />
                  }
                >
                  <User />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href="/settings"
                      prefetch
                      onClick={() => client.logEvent("settings_click")}
                    />
                  }
                >
                  <Settings />
                  <span>Team Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
