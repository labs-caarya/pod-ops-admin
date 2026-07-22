import { Castle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";

export default function CastleApplicants() {
  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-6">
      <PageHeader
        title="Castle applicants"
        description="Review Castle applications from students ready for activating pod work across the network."
        icon={Castle}
      />

      <Card className="flex min-h-64 items-center justify-center p-6">
        <EmptyState
          icon={Castle}
          title="No Castle applicants yet"
          description="Students applying through Castles will show up here for Caarya and pod teams to review."
        />
      </Card>
    </div>
  );
}
