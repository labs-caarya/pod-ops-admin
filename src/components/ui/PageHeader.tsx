import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  actionsClassName,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
  actionsClassName?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ruby/25 bg-ruby/10 text-ruby-bright">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
          <h1 className="min-w-0 break-words font-display text-xl font-black tracking-tight text-ink sm:text-2xl">{title}</h1>
        </div>
        {actions && <div className={cn("flex shrink-0 items-center gap-1.5", actionsClassName)}>{actions}</div>}
      </div>
      {description && <p className="mt-2 w-full text-sm leading-relaxed text-ink-muted">{description}</p>}
    </div>
  );
}
