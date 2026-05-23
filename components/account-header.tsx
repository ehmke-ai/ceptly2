"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useStatsigClient } from "@statsig/react-bindings";

import { signOut } from "@/actions/auth";
import type { AuthUser } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { label: "Chat", path: "/chat" },
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
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { client } = useStatsigClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              <button
                onClick={() => {
                  client.logEvent("logo_click");
                  router.push("/chat");
                }}
                className="cursor-pointer"
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
              </button>
            </div>

            <nav className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  client.logEvent("workspace_nav_click");
                  router.push("/settings");
                }}
              >
                {workspaceName}
              </Button>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={
                    pathname.startsWith(item.matchPrefix ?? item.path)
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() => {
                    client.logEvent("navigation_click", item.path);
                    router.push(item.path);
                  }}
                >
                  {item.label}
                </Button>
              ))}
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
                  onClick={() => {
                    client.logEvent("account_settings_click");
                    router.push("/settings/account");
                  }}
                >
                  <User />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    client.logEvent("settings_click");
                    router.push("/settings");
                  }}
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
