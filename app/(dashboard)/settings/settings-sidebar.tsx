"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plug, Settings2, User } from "lucide-react";

import { cn } from "@/lib/utils";

export const settingsNavItems = [
  {
    label: "Team Settings",
    href: "/settings",
    icon: Settings2,
    exact: true,
  },
  {
    label: "Account",
    href: "/settings/account",
    icon: User,
    exact: false,
  },
  {
    label: "Integrations",
    href: "/settings/integrations",
    icon: Plug,
    exact: false,
  },
  {
    label: "Conversations",
    href: "/settings/conversations",
    icon: MessageSquare,
    exact: false,
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <nav className="flex flex-col gap-1 p-3">
        {settingsNavItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
