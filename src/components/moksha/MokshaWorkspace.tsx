import { useEffect, useRef, useState } from "react";
import { MokshaChatPanel } from "@/components/moksha/MokshaChatPanel";
import { MokshaModeSwitch, type MokshaMode } from "@/components/moksha/MokshaModeSwitch";
import { MokshaTaskAssignPanel } from "@/components/moksha/MokshaTaskAssignPanel";
import { MokshaCommentPanel } from "@/components/moksha/MokshaCommentPanel";
import { mokshaModeFromShortcut, shouldHandleMokshaModeShortcut } from "@/lib/mokshaShortcut";
import { cn } from "@/lib/utils";

export function MokshaWorkspace({ className }: { className?: string }) {
  const [mode, setMode] = useState<MokshaMode>("insights");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleMokshaModeShortcut(event)) return;
      const root = rootRef.current;
      if (!root) return;
      const target = event.target;
      if (target instanceof Node && !root.contains(target)) return;

      const next = mokshaModeFromShortcut(event);
      if (!next) return;
      event.preventDefault();
      setMode(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={rootRef} className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {mode === "insights" ? (
          <MokshaChatPanel className="min-h-0 flex-1" />
        ) : mode === "tasks" ? (
          <MokshaTaskAssignPanel className="min-h-0 flex-1" />
        ) : (
          <MokshaCommentPanel className="min-h-0 flex-1" />
        )}
      </div>
      <MokshaModeSwitch mode={mode} onChange={setMode} className="mt-3 shrink-0" />
    </div>
  );
}
