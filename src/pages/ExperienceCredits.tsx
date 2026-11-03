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
import { useAuth } from "@/contexts/AuthContext";

type TabId = "members" | "work" | "referrals" | "lor" | "rules";

export default function ExperienceCredits() {
  const { user } = useAuth();
  const crewManager = user?.accountType === "crew_manager";
  const [tab, setTab] = useState<TabId>("members");
  const rules = useQuery(experienceRulesQuery()).data;
  const pendingWork = useQuery(workItemsQuery("in_review")).data?.length ?? 0;
  const pendingReferrals = useQuery(referralsQuery("submitted")).data?.length ?? 0;
  const pendingLor = useQuery({ ...lorQuery("requested"), enabled: !crewManager }).data?.length ?? 0;

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Experience Credits"
        description={crewManager
          ? `Manage credit reviews and recognition for ${user?.crewScope?.label || "your CREW"}.`
          : "Recognise the work pod members do. Credits are earned from updates, work, research, referrals, assessments and internal events, and unlock a Letter of Recommendation."}
      />
      {crewManager ? <p className="mb-4 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2 text-sm text-ink-muted">Managing: <strong className="text-ink">{user?.crewScope?.label || "Assigned CREW"}</strong>. Only members and reviews in this CREW are available.</p> : null}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "members", label: "Members" },
          { id: "work", label: "Work reviews", badge: pendingWork },
          { id: "referrals", label: "Referrals", badge: pendingReferrals },
          ...(crewManager ? [] : [{ id: "lor" as const, label: "Letters of Recommendation", badge: pendingLor }]),
          ...(crewManager ? [] : [{ id: "rules" as const, label: "Rules" }]),
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
