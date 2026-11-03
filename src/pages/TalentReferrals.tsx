import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { ReferralsTab } from "@/components/experience/ReferralsTab";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { markTalentReferralsSeen } from "@/lib/experienceApi";
import { experienceKeys } from "@/lib/experienceQueries";

export default function TalentReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const markSeen = useMutation({
    mutationFn: markTalentReferralsSeen,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: experienceKeys.referralUnread }),
  });
  useEffect(() => { markSeen.mutate(); }, []);
  const crewManager = user?.accountType === "crew_manager";
  return (
    <div>
      <PageHeader icon={UserPlus} title="Talent Referrals" description={crewManager ? `Review referrals from ${user?.crewScope?.label || "your CREW"}.` : "Review referrals from every pod and confirm their next step."} />
      <ReferralsTab />
    </div>
  );
}
