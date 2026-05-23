import { EmployeeChatPrompt } from "@/components/employee-chat-prompt";
import { requireAuth } from "@/lib/auth/server";

const ADMIN_ROLES = new Set(["founder", "admin"]);

export default async function Home() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col">
        {workspace?.id ? (
          <EmployeeChatPrompt workspaceId={workspace.id} canEdit={canEdit} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to Ceptly
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No workspace found for your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
