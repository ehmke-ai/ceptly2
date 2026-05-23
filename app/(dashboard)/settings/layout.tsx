import { SettingsSidebar } from "./settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <SettingsSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-muted/20">{children}</div>
    </div>
  );
}
