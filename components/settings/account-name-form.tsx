"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { updateUserName, type AccountNameFormState } from "@/actions/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccountNameFormProps {
  initialFullName: string;
  email: string;
}

export function AccountNameForm({
  initialFullName,
  email,
}: AccountNameFormProps) {
  const [state, formAction, pending] = useActionState<
    AccountNameFormState,
    FormData
  >(updateUserName, {});

  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your name appears in the header and across Ceptly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.errors?._form ? (
            <Alert variant="destructive">
              <AlertDescription>{state.errors._form[0]}</AlertDescription>
            </Alert>
          ) : null}

          {state.success ? (
            <Alert>
              <AlertDescription>Name updated.</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              name="fullName"
              defaultValue={initialFullName}
              placeholder="Your name"
              required
              maxLength={200}
            />
            {state.errors?.fullName ? (
              <p className="text-sm text-destructive">
                {state.errors.fullName[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              name="email"
              value={email}
              readOnly
              disabled
              className="bg-muted/40"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed here.
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
