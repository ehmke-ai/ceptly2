"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { acceptInviteAction } from "@/actions/invites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function AcceptButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Joining...
        </>
      ) : (
        "Join workspace"
      )}
    </Button>
  );
}

interface InviteAcceptFormProps {
  token: string;
}

export function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const [state, formAction] = useActionState(acceptInviteAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <AcceptButton />
    </form>
  );
}
