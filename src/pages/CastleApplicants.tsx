import { Castle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";

export default function CastleApplicants() {
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col gap-4 overflow-hidden lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        title="Castle applicants"
        description="Review Castle applications from students ready for activating pod work across the network."
        icon={Castle}
        className="mb-0 shrink-0"
      />

      <Card className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <EmptyState
          icon={Castle}
          title="No Castle applicants yet"
          description="Students applying through Castles will show up here for Caarya and pod teams to review."
        />
      </Card>
    </div>
  );
}
