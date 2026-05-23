import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceMembership } from "@/lib/api/types";
import { formatWorkspaceRole } from "@/lib/roles";

interface AccountRoleCardProps {
  role: WorkspaceMembership["role"] | null;
  teamName: string | null;
}

export function AccountRoleCard({ role, teamName }: AccountRoleCardProps) {
  return (
    <Card className="dark:border-white/20">
      <CardHeader>
        <CardTitle>Team role</CardTitle>
        <CardDescription>
          Your permissions in {teamName ?? "your team"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {role ? (
          <p className="text-sm font-medium">{formatWorkspaceRole(role)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are not assigned to a team yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
