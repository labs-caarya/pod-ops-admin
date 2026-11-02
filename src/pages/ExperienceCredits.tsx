import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { LorTab } from "@/components/experience/LorTab";
import { MembersTab } from "@/components/experience/MembersTab";
import { ReferralsTab } from "@/components/experience/ReferralsTab";
import { RulesTab } from "@/components/experience/RulesTab";
import { Tabs } from "@/components/experience/shared";
import { WorkReviewsTab } from "@/components/experience/WorkReviewsTab";
import { PageHeader } from "@/components/ui/PageHeader";
import { experienceRulesQuery, lorQuery, referralsQuery, workItemsQuery } from "@/lib/experienceQueries";

type TabId = "members" | "work" | "referrals" | "lor" | "rules";

export default function ExperienceCredits() {
  const [tab, setTab] = useState<TabId>("members");
  const rules = useQuery(experienceRulesQuery()).data;
  const pendingWork = useQuery(workItemsQuery("in_review")).data?.length ?? 0;
  const pendingReferrals = useQuery(referralsQuery("submitted")).data?.length ?? 0;
  const pendingLor = useQuery(lorQuery("requested")).data?.length ?? 0;

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Experience Credits"
        description="Recognise the work pod members do. Credits are earned from updates, work, research, referrals, assessments and internal events, and unlock a Letter of Recommendation."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "members", label: "Members" },
          { id: "work", label: "Work reviews", badge: pendingWork },
          { id: "referrals", label: "Referrals", badge: pendingReferrals },
          { id: "lor", label: "Letters of Recommendation", badge: pendingLor },
          { id: "rules", label: "Rules" },
        ]}
      />
      {tab === "members" ? <MembersTab /> : null}
      {tab === "work" ? <WorkReviewsTab /> : null}
      {tab === "referrals" ? <ReferralsTab openingCredits={rules?.referralOpeningCredits} programCredits={rules?.referralSelectedCredits} /> : null}
      {tab === "lor" ? <LorTab threshold={rules?.lorThreshold} /> : null}
      {tab === "rules" ? <RulesTab /> : null}
    </div>
  );
}
