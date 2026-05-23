"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  updateWorkspaceTimezone,
  type WorkspaceTimezoneFormState,
} from "@/actions/conversations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";

interface WorkspaceTimezoneFormProps {
  workspaceId: string;
  initialTimezone: string;
  canEdit: boolean;
}

export function WorkspaceTimezoneForm({
  workspaceId,
  initialTimezone,
  canEdit,
}: WorkspaceTimezoneFormProps) {
  const [state, formAction, pending] = useActionState<
    WorkspaceTimezoneFormState,
    FormData
  >(updateWorkspaceTimezone, {});

  if (!canEdit) {
    return (
      <Card className="dark:border-white/20">
        <CardHeader>
          <CardTitle>Workspace timezone</CardTitle>
          <CardDescription>
            Default timezone for new conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{initialTimezone}</p>
        </CardContent>
      </Card>
    );
  }

  const timezoneGroups = groupTimezonesByRegion();
  const hasTimezoneInList = TIMEZONE_OPTIONS.some(
    (tz) => tz.value === initialTimezone,
  );

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Workspace timezone</CardTitle>
        <CardDescription>
          Used as the default when you create a new scheduled conversation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />

          {state.errors?._form ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          {state.success ? (
            <Alert>
              <AlertDescription>Timezone updated.</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="workspace-timezone">Timezone</Label>
            <select
              id="workspace-timezone"
              name="timezone"
              defaultValue={initialTimezone}
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {!hasTimezoneInList ? (
                <option value={initialTimezone}>{initialTimezone}</option>
              ) : null}
              {Object.entries(timezoneGroups).map(([region, options]) => (
                <optgroup key={region} label={region}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save timezone"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
