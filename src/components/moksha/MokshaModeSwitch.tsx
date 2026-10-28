import { MOKSHA_MODE_SHORTCUT_HINT } from "@/lib/mokshaShortcut";
import { cn } from "@/lib/utils";
import { BarChart3, ClipboardList, MessageSquareText } from "lucide-react";

export type MokshaMode = "insights" | "tasks" | "comments";

export function MokshaModeSwitch({
  mode,
  onChange,
  className,
}: {
  mode: MokshaMode;
  onChange: (mode: MokshaMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 rounded-xl border border-line bg-surface p-1",
        className,
      )}
      role="tablist"
      aria-label="Moksha mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "insights"}
        aria-keyshortcuts="Alt+I"
        title={`Insights (${MOKSHA_MODE_SHORTCUT_HINT.insights})`}
        onClick={() => onChange("insights")}
        className={cn(
          "focus-ring flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors sm:flex-row sm:gap-1 sm:py-2 sm:text-xs",
          mode === "insights" ? "bg-surface-3 text-ink shadow-sm" : "text-ink-muted hover:text-ink",
        )}
      >
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5 shrink-0" />
          Insights
        </span>
        <kbd className="hidden font-mono text-[9px] text-ink-faint sm:inline">{MOKSHA_MODE_SHORTCUT_HINT.insights}</kbd>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "tasks"}
        aria-keyshortcuts="Alt+T"
        title={`Tasks (${MOKSHA_MODE_SHORTCUT_HINT.tasks})`}
        onClick={() => onChange("tasks")}
        className={cn(
          "focus-ring flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors sm:flex-row sm:gap-1 sm:py-2 sm:text-xs",
          mode === "tasks" ? "bg-surface-3 text-ink shadow-sm" : "text-ink-muted hover:text-ink",
        )}
      >
        <span className="flex items-center gap-1">
          <ClipboardList className="h-3.5 w-3.5 shrink-0" />
          Tasks
        </span>
        <kbd className="hidden font-mono text-[9px] text-ink-faint sm:inline">{MOKSHA_MODE_SHORTCUT_HINT.tasks}</kbd>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "comments"}
        aria-keyshortcuts="Alt+C"
        title={`Comments (${MOKSHA_MODE_SHORTCUT_HINT.comments})`}
        onClick={() => onChange("comments")}
        className={cn(
          "focus-ring flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors sm:flex-row sm:gap-1 sm:py-2 sm:text-xs",
          mode === "comments" ? "bg-surface-3 text-ink shadow-sm" : "text-ink-muted hover:text-ink",
        )}
      >
        <span className="flex items-center gap-1">
          <MessageSquareText className="h-3.5 w-3.5 shrink-0" />
          Comments
        </span>
        <kbd className="hidden font-mono text-[9px] text-ink-faint sm:inline">{MOKSHA_MODE_SHORTCUT_HINT.comments}</kbd>
      </button>
    </div>
  );
}
