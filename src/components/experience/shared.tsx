import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function errorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function formatCredits(value: number) {
  return value.toLocaleString("en-IN");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** `datetime-local` inputs use local time without a zone; convert both ways. */
export function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "focus-ring -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "border-ruby text-ink" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.badge ? (
              <span className="rounded-full bg-ruby/15 px-1.5 text-[11px] font-semibold text-ruby-bright">{tab.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function QueryState({
  isLoading,
  error,
  onRetry,
  label,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  label: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading {label}…
      </div>
    );
  }
  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display font-bold text-ink">{label} could not be loaded</p>
        <p className="mt-1 text-sm text-ink-muted">{errorMessage(error)}</p>
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }
  return null;
}

export function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{message}</p>;
}

export const searchInputClass =
  "min-h-10 w-full rounded-xl border border-line bg-surface-2 py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-ruby focus:ring-2 focus:ring-ruby/25";
