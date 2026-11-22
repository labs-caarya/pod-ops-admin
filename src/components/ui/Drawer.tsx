import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-xl",
  panelClassName,
  bodyClassName,
  footerClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  panelClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh justify-end">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade_0.2s_ease]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex h-full min-w-0 w-full max-w-none flex-col border-line bg-base-2 shadow-2xl sm:border-l",
          "animate-[slidein_0.25s_ease]",
          width,
          panelClassName,
        )}
        style={{ animationFillMode: "both" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-5 sm:py-4">
          <div className="min-w-0 break-words">
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="focus-ring grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5", bodyClassName)}>{children}</div>
        {footer && <div className={cn("shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4", footerClassName)}>{footer}</div>}
      </div>
      <style>{`
        @keyframes slidein { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes slideup { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>,
    document.body,
  );
}
