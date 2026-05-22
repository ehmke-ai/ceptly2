"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useStatsigClient } from "@statsig/react-bindings";
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

const staticUser = {
  fullName: "Demo User",
  email: "demo@ceptly.com",
};

const navigationItems = [
  { label: "Chat", path: "/" },
  { label: "Metrics", path: "/metrics" },
  { label: "Settings", path: "/settings" },
];

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

export function AccountHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { client } = useStatsigClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    client.logEvent("sign_out_click");
    router.push("/");
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  client.logEvent("logo_click");
                  router.push("/");
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
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={pathname.startsWith(item.path) ? "default" : "ghost"}
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
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getInitials(staticUser.fullName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {staticUser.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {staticUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    client.logEvent("account_settings_click");
                    router.push("/settings");
                  }}
                >
                  <User />
                  <span>Account Settings</span>
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
