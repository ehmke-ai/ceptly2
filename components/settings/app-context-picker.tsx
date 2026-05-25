"use client";

import Link from "next/link";

import { Label } from "@/components/ui/label";
import type { AppContextOption } from "@/lib/api/types";

interface AppContextPickerProps {
  options: AppContextOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function AppContextPicker({
  options,
  selectedIds,
  onChange,
  disabled = false,
}: AppContextPickerProps) {
  const toggle = (id: string, selectable: boolean) => {
    if (disabled || !selectable) {
      return;
    }
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Label>App context</Label>
      <p className="text-sm text-muted-foreground">
        Connect external tools so the check-in agent knows what each person is
        working on before messaging them in Slack.
      </p>
      <ul className="space-y-2">
        {options.map((option) => {
          const checked = selectedIds.includes(option.id);
          const isDisabled = disabled || !option.selectable;

          return (
            <li
              key={option.id}
              className={`rounded-lg border px-4 py-3 dark:border-white/10 ${
                checked ? "border-primary bg-primary/5" : "border-border"
              } ${isDisabled ? "opacity-60" : ""}`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={isDisabled}
                  onChange={() => toggle(option.id, option.selectable)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{option.label}</span>
                    {option.coming_soon ? (
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    ) : null}
                    {!option.coming_soon && !option.connected ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Not connected
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                  {!option.coming_soon && !option.connected ? (
                    <Link
                      href={`/settings/integrations/${option.id}`}
                      className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Connect {option.label} in Settings
                    </Link>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
