import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer } from "@/components/ui/Drawer";
import { MokshaWorkspace } from "@/components/moksha/MokshaWorkspace";
import { isMokshaShortcut, MOKSHA_OPEN_EVENT } from "@/lib/mokshaShortcut";

export function MokshaAssistant() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openMoksha = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setOpen(true);
      return;
    }
    if (location.pathname !== "/moksha") {
      navigate("/moksha");
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isMokshaShortcut(event)) return;
      event.preventDefault();
      openMoksha();
    };
    const onOpenEvent = () => openMoksha();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(MOKSHA_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(MOKSHA_OPEN_EVENT, onOpenEvent);
    };
  }, [openMoksha]);

  return (
    <>
      <button
        type="button"
        onClick={() => openMoksha()}
        aria-label="Open Moksha"
        aria-keyshortcuts="Control+Shift+M"
        title="Open Moksha (Ctrl+Shift+M)"
        className="focus-ring fixed bottom-6 right-6 z-40 hidden h-14 w-14 overflow-hidden rounded-full border border-line bg-surface p-0.5 shadow-xl transition-transform hover:scale-105 lg:flex"
      >
        <img src="/moksha-icon.png" alt="Moksha" className="h-full w-full rounded-full object-cover" />
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Moksha"
        subtitle="Insights, task assignments, and @pod comments without leaving your flow."
        width="max-w-md"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <MokshaWorkspace />
      </Drawer>
    </>
  );
}
