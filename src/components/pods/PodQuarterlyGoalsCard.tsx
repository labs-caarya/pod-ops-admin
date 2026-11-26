import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { requestJson, unwrapData } from "@/lib/api";

export function PodQuarterlyGoalsCard({ collegeId }: { collegeId: string }) {
  const { user } = useAuth();
  const allowed = user?.accountType === "super_admin" || user?.accountType === "pod_ops_admin"
    || (!user?.accountType && user?.permissions?.some((permission) => permission === "*" || permission === "pod_ops:admin"));
  const progress = useQuery({
    queryKey: ["quarterly-goals-pod", collegeId],
    enabled: Boolean(allowed && collegeId),
    refetchInterval: 30_000,
    queryFn: async () => {
      const data = unwrapData<{ goals: { id: string; title: string; metric: string; target: number }[]; counts: Record<string, number | null> }>(
        await requestJson(`/quarterly-goals/manage/pod/${encodeURIComponent(collegeId)}`),
      );
      if (!data) throw new Error("Quarterly progress is unavailable.");
      return data;
    },
  });
  if (!allowed) return null;
  return <Card className="space-y-2 p-4">
    <div className="flex flex-wrap justify-between gap-2">
      <h2 className="font-semibold">Quarterly Goals</h2>
      <Link className="text-ruby-bright" to="/quarterly-targets">Manage goals →</Link>
    </div>
    {progress.isPending && <p role="status">Loading progress…</p>}
    {progress.isError && <p role="alert">{progress.error.message}</p>}
    {progress.data && (progress.data.goals.length ? <ul>
      {progress.data.goals.map((goal) => <li key={goal.id}>{goal.title} · {progress.data.counts[goal.metric] ?? "Unavailable"} / {goal.target}</li>)}
    </ul> : <p>Quarterly goals are yet to be added.</p>)}
  </Card>;
}
