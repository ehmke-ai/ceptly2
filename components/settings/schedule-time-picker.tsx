"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatHour12Label,
  formatMinuteLabel,
  formatTimeLocal12,
  HOURS_12,
  parseTimeLocal24,
  QUARTER_HOUR_MINUTES,
  toTimeLocal24,
  type SchedulePeriod,
  type ScheduleTimeParts,
} from "@/lib/schedule/time-picker";
import { cn } from "@/lib/utils";

interface ScheduleTimePickerProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
}

function TimeColumn<T extends string | number>({
  options,
  value,
  onSelect,
  formatOption,
  disabled,
  columnLabel,
  scrollable = true,
}: {
  options: readonly T[];
  value: T;
  onSelect: (value: T) => void;
  formatOption: (value: T) => string;
  disabled?: boolean;
  columnLabel: string;
  scrollable?: boolean;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!scrollable) {
      return;
    }
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [scrollable, value]);

  return (
    <div
      role="listbox"
      aria-label={columnLabel}
      className={cn("flex-1 py-1", scrollable && "max-h-56 overflow-y-auto")}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={String(option)}
            ref={selected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              "mx-1 flex w-[calc(100%-0.5rem)] items-center justify-center rounded-md px-3 py-2 text-sm tabular-nums outline-none",
              selected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted/80",
            )}
          >
            {formatOption(option)}
          </button>
        );
      })}
    </div>
  );
}

export function ScheduleTimePicker({
  id,
  label = "Time",
  value,
  onChange,
  disabled = false,
  helperText = "Standups run on 15-minute intervals (e.g. 9:00, 9:15, 9:30).",
}: ScheduleTimePickerProps) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<ScheduleTimeParts>(() =>
    parseTimeLocal24(value),
  );

  useEffect(() => {
    setParts(parseTimeLocal24(value));
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const updateParts = (patch: Partial<ScheduleTimeParts>) => {
    setParts((current) => {
      const next = { ...current, ...patch };
      onChange(toTimeLocal24(next));
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div ref={containerRef} className="relative max-w-xs">
        <Button
          id={fieldId}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="w-full justify-between font-normal"
        >
          <span>{formatTimeLocal12(value)}</span>
          <Clock className="size-4 shrink-0 opacity-50" />
        </Button>

        {open ? (
          <div className="absolute top-[calc(100%+0.25rem)] z-50 w-full min-w-[16rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10">
            <div className="grid grid-cols-3 divide-x divide-border">
              <TimeColumn
                columnLabel="Hour"
                options={HOURS_12}
                value={parts.hour12}
                onSelect={(hour12) => updateParts({ hour12 })}
                formatOption={formatHour12Label}
                disabled={disabled}
                scrollable={true}
              />
              <TimeColumn
                columnLabel="Minute"
                options={QUARTER_HOUR_MINUTES}
                value={parts.minute}
                onSelect={(minute) => updateParts({ minute })}
                formatOption={formatMinuteLabel}
                disabled={disabled}
              />
              <TimeColumn
                columnLabel="AM or PM"
                options={["AM", "PM"] as const}
                value={parts.period}
                onSelect={(period) =>
                  updateParts({ period: period as SchedulePeriod })
                }
                formatOption={(period) => period}
                disabled={disabled}
              />
            </div>
          </div>
        ) : null}
      </div>
      {helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
