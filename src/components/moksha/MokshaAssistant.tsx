import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { MokshaChatPanel } from "@/components/moksha/MokshaChatPanel";

export function MokshaAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Moksha chat"
        title="Chat with Moksha"
        className="focus-ring fixed bottom-6 right-6 z-40 hidden h-14 w-14 overflow-hidden rounded-full border border-line bg-surface p-0.5 shadow-xl transition-transform hover:scale-105 lg:flex"
      >
        <img src="/moksha-icon.png" alt="Moksha" className="h-full w-full rounded-full object-cover" />
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Moksha"
        subtitle="Ask about Caarya, pods, and this admin workspace."
        width="max-w-md"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <MokshaChatPanel />
      </Drawer>
    </>
  );
}
