import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ruby/30 bg-ruby/10 text-ruby-bright">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-black tracking-tight text-ink break-words sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
