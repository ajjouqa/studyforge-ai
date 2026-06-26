import { cn } from "@/lib/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
    size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
    variant === "primary" &&
      "bg-accent text-accent-fg hover:opacity-90 shadow-sm",
    variant === "secondary" &&
      "border border-border bg-surface text-foreground hover:bg-background",
    variant === "ghost" && "text-muted hover:bg-background hover:text-foreground",
    variant === "danger" &&
      "border border-red-300 bg-surface text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40",
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </Card>
  );
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  STREAMING: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  READY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-zinc-100 text-zinc-600"
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
