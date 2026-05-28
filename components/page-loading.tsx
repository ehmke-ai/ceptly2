import { cn } from "@/lib/utils";

interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 animate-pulse flex-col gap-6 px-6 py-8",
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
