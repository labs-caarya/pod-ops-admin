import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { MokshaWorkspace } from "@/components/moksha/MokshaWorkspace";

export default function AskMoksha() {
  return (
    <div className="flex h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] min-h-0 flex-col lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Moksha"
        description="Business intelligence for the pod network — activity, risks, and next actions."
        className="mb-4 shrink-0"
        actions={
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface p-0.5">
            <img src="/moksha-icon.png" alt="" className="h-full w-full rounded-full object-cover" />
          </div>
        }
      />
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
        <MokshaWorkspace />
      </Card>
    </div>
  );
}
