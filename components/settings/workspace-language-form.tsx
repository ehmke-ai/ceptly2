"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  updateWorkspaceLanguage,
  type WorkspaceLanguageFormState,
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
import { getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

interface WorkspaceLanguageFormProps {
  workspaceId: string;
  initialLanguage: string;
  canEdit: boolean;
}

export function WorkspaceLanguageForm({
  workspaceId,
  initialLanguage,
  canEdit,
}: WorkspaceLanguageFormProps) {
  const [state, formAction, pending] = useActionState<
    WorkspaceLanguageFormState,
    FormData
  >(updateWorkspaceLanguage, {});

  if (!canEdit) {
    return (
      <Card className="dark:border-white/20">
        <CardHeader>
          <CardTitle>Team language</CardTitle>
          <CardDescription>
            Default language for check-in conversations with roster members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {getLanguageLabel(initialLanguage)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasLanguageInList = SUPPORTED_LANGUAGES.some(
    (language) => language.code === initialLanguage,
  );

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Team language</CardTitle>
        <CardDescription>
          Default language for check-in conversations with roster members.
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
              <AlertDescription>Language updated.</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="workspace-language">Language</Label>
            <select
              id="workspace-language"
              name="language"
              defaultValue={initialLanguage}
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {!hasLanguageInList ? (
                <option value={initialLanguage}>
                  {getLanguageLabel(initialLanguage)}
                </option>
              ) : null}
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
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
              "Save language"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
