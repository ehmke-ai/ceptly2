"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOutForInvite } from "@/actions/auth";
import { Button } from "@/components/ui/button";

function SwitchAccountButton({ inviteToken }: { inviteToken: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Switching account...
        </>
      ) : (
        "Switch account"
      )}
    </Button>
  );
}

interface InviteSwitchAccountFormProps {
  inviteToken: string;
}

export function InviteSwitchAccountForm({
  inviteToken,
}: InviteSwitchAccountFormProps) {
  return (
    <form action={signOutForInvite.bind(null, inviteToken)}>
      <SwitchAccountButton inviteToken={inviteToken} />
    </form>
  );
}
