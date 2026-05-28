"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useTheme } from "next-themes";

import { Input } from "@/components/ui/input";
import type { WorkspaceIntegration } from "@/lib/api/integrations";
import { getIntegrationLogo } from "@/lib/integrations/logos";
import { cn } from "@/lib/utils";

interface IntegrationsGridProps {
  integrations: WorkspaceIntegration[];
}

export function IntegrationsGrid({ integrations }: IntegrationsGridProps) {
  const [query, setQuery] = useState("");
  const { resolvedTheme, theme } = useTheme();
  const logoTheme = (resolvedTheme ?? theme) === "dark" ? "dark" : "light";

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return integrations;
    }

    return integrations.filter((integration) =>
      integration.name.toLowerCase().includes(normalized),
    );
  }, [integrations, query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search integrations..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No integrations match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((integration) => {
            const logo = getIntegrationLogo(integration.id, logoTheme);

            return (
              <Link
                key={integration.id}
                href={`/settings/integrations/${integration.id}`}
                className={cn(
                  "flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors",
                  "hover:border-foreground/20 hover:bg-accent/30 dark:border-white/10",
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-md bg-muted/50">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={`${integration.name} logo`}
                      width={32}
                      height={32}
                      className="size-8"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {integration.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{integration.name}</p>
                  {integration.connected ? (
                    <p className="text-sm text-muted-foreground">Enabled</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
