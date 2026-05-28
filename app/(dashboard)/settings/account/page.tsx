import { AccountNameForm } from "@/components/settings/account-name-form";
import { AccountRoleCard } from "@/components/settings/account-role-card";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { requireAuth } from "@/lib/auth/server";

export default async function AccountSettingsPage() {
  const user = await requireAuth();
  const team = user.workspaces?.[0];

  const displayName = user.fullName?.trim() || user.email.split("@")[0] || "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Account settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile and appearance.
          </p>
        </div>
      </div>

      <AccountNameForm initialFullName={displayName} email={user.email} />

      <AccountRoleCard
        role={team?.role ?? null}
        teamName={team?.name ?? null}
      />

      <ThemeSettings />
    </div>
  );
}
