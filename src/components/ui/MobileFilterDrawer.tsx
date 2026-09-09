import { Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

export function MobileFilterDrawer({
  open,
  onOpen,
  onClose,
  active = false,
  title = "Filters",
  triggerLabel = "Open filters",
  children,
  onClear,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  active?: boolean;
  title?: string;
  triggerLabel?: string;
  children: React.ReactNode;
  onClear?: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant={active ? "primary" : "secondary"}
        size="icon"
        className="sm:hidden"
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-expanded={open}
        onClick={onOpen}
      >
        <Filter className="h-4 w-4" />
      </Button>
      <Drawer
        open={open}
        onClose={onClose}
        title={title}
        width="max-w-md"
        footer={
          <div className={cn("flex gap-2", !active && "justify-end")}>
            {active && onClear ? (
              <Button type="button" variant="ghost" className="flex-1" onClick={onClear}>
                Clear filters
              </Button>
            ) : null}
            <Button type="button" className={active ? "flex-1" : undefined} onClick={onClose}>
              Apply
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">{children}</div>
      </Drawer>
    </>
  );
}
