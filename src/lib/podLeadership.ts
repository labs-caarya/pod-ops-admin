import type { PodPortfolioEntry } from "@/lib/api";

export function leadershipRows(pod: PodPortfolioEntry) {
  return [
    { role: "Exec Lead", name: pod.podLeader },
    { role: "Talent Development Lead", name: pod.podTalentManager },
    { role: "Marketing Lead", name: pod.podOutreachManager },
    { role: "Ops Lead", name: pod.podResearcher },
    { role: "Partner Relations Lead", name: pod.podPartnerManager },
    { role: "Strategic Partnership Associate", name: pod.podStrategicPartnershipAssociate || "" },
  ];
}
