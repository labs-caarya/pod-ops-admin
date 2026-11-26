import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { requestJson, unwrapData } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { podPortfolioQueryOptions } from "@/lib/adminQueries";

interface Goal {
  id: string;
  title: string;
  description: string;
  section: string;
  target: number;
  unit: string;
  cadence: string;
  roles: string[];
  metric: string;
  href: string;
}

interface Options {
  quarter: string;
  sections: string[];
  roles: string[];
  metrics: { id: string; label: string }[];
}

interface Playbook { draft: Goal[]; published: Goal[] }

const roleLabels: Record<string, string> = {
  exec: "Exec Lead", ops: "Ops Lead", marketing: "Marketing Lead",
  tdl: "Talent Development Lead", prl: "Partner Relations Lead", spaa: "Strategic Partnership Associate",
};

async function load<T>(path: string, init?: RequestInit) {
  const data = unwrapData<T>(await requestJson(`/quarterly-goals/manage${path}`, init));
  if (!data) throw new Error("Quarterly Goals returned an incomplete response.");
  return data;
}

export default function AdminQuarterlyGoals() {
  const { user } = useAuth();
  const allowed = user?.accountType === "super_admin" || user?.accountType === "pod_ops_admin"
    || (!user?.accountType && user?.permissions?.some((permission) => permission === "*" || permission === "pod_ops:admin"));
  const options = useQuery({ queryKey: ["quarterly-goals-options", user?.id], queryFn: () => load<Options>(""), enabled: Boolean(allowed) });
  const [selected, setSelected] = useState("");
  if (!allowed) return <p role="alert">You don’t have access to manage quarterly goals.</p>;
  if (options.isError) return <p role="alert">{options.error.message}</p>;
  if (!options.data) return <p role="status">Loading quarterly goals…</p>;
  const quarter = selected || options.data.quarter;

  return <>
    <PageHeader icon={Flag} title="Quarterly Goals" description="Applies to all pods." />
    <PodProgress />
    <label className="mb-4 grid max-w-xs gap-1">Quarter
      <input className="rounded-lg border border-line bg-surface p-2" value={quarter} onChange={(event) => setSelected(event.target.value)} placeholder="2026-Q4" />
    </label>
    {/^20\d{2}-Q[1-4]$/.test(quarter)
      ? <QuarterEditor key={quarter} options={options.data} quarter={quarter} />
      : <p>Enter a quarter in YYYY-Q1 through YYYY-Q4 format.</p>}
  </>;
}

function PodProgress() {
  const [pod, setPod] = useState("");
  const portfolio = useQuery(podPortfolioQueryOptions());
  const progress = useQuery({
    queryKey: ["quarterly-goals-pod", pod],
    queryFn: () => load<{ goals: Goal[]; counts: Record<string, number | null> }>(`/pod/${encodeURIComponent(pod)}`),
    enabled: Boolean(pod),
    refetchInterval: 30_000,
  });
  return <Card className="mb-4 space-y-2 p-4">
    <label className="block">Current quarter progress by pod
      <select className="ml-2 rounded-lg border border-line bg-surface p-2" value={pod} onChange={(event) => setPod(event.target.value)}>
        <option value="">Select a pod</option>
        {(portfolio.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    {portfolio.isError && <p role="alert">Could not load pods.</p>}
    {pod && progress.isPending && <p role="status">Loading progress…</p>}
    {pod && progress.isError && <p role="alert">{progress.error.message}</p>}
    {progress.data && (progress.data.goals.length ? <ul>
      {progress.data.goals.map((goal) => <li key={goal.id}>{goal.title} · {progress.data.counts[goal.metric] ?? "Unavailable"} / {goal.target}</li>)}
    </ul> : <p>Quarterly goals are yet to be added.</p>)}
  </Card>;
}

function QuarterEditor({ options, quarter }: { options: Options; quarter: string }) {
  const cache = useQueryClient();
  const key = ["quarterly-playbook-admin", quarter];
  const query = useQuery({ queryKey: key, queryFn: () => load<Playbook>(`/${quarter}`) });
  const [edits, setEdits] = useState<Goal[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  if (query.isError) return <p role="alert">{query.error.message}</p>;
  if (!query.data) return <p role="status">Loading playbook…</p>;
  const goals = edits ?? query.data.draft;

  const change = (id: string, fields: Partial<Goal>) => setEdits(goals.map((goal) => goal.id === id ? { ...goal, ...fields } : goal));
  const moveUp = (index: number) => {
    const next = [...goals];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setEdits(next);
  };
  const save = async (publish: boolean) => {
    if (publish && !window.confirm("Publish this playbook to all pods? This replaces the currently published goals for this quarter.")) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await load<Playbook>(`/${quarter}`, {
        method: "PUT", body: JSON.stringify({ goals, publish }),
      });
      cache.setQueryData(key, saved);
      if (publish) void cache.invalidateQueries({ queryKey: ["quarterly-goals-pod"] });
      setEdits(null);
      setMessage(publish ? "Published for all pods." : "Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save quarterly goals.");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = "w-full rounded-lg border border-line bg-surface p-2";
  return <div className="space-y-4">
    <p>{query.data.published.length ? `${query.data.published.length} goals published.` : "Quarterly goals are yet to be added."}</p>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(false); }}>
      <fieldset disabled={busy} className="space-y-4">
        {goals.map((goal, index) => <Card key={goal.id} className="space-y-3 p-4">
          {preview ? <>
            <h2 className="font-semibold">{goal.title}</h2>
            <p>{goal.description}</p>
            <p>{goal.target} {goal.unit}{goal.cadence && ` · ${goal.cadence}`}</p>
            <p>{goal.roles.map((role) => roleLabels[role] ?? role).join(", ")}</p>
          </> : <>
            <label className="block">Title<input className={fieldClass} required value={goal.title} onChange={(e) => change(goal.id, { title: e.target.value })} /></label>
            <label className="block">Description<textarea className={fieldClass} value={goal.description} onChange={(e) => change(goal.id, { description: e.target.value })} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>Section<select className={fieldClass} value={goal.section} onChange={(e) => change(goal.id, { section: e.target.value })}>{options.sections.map((section) => <option key={section}>{section}</option>)}</select></label>
              <label>Progress metric<select className={fieldClass} value={goal.metric} onChange={(e) => change(goal.id, { metric: e.target.value })}>{options.metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.label}</option>)}</select></label>
              <label>Target<input className={fieldClass} type="number" min={1} required value={goal.target || ""} onChange={(e) => change(goal.id, { target: Number(e.target.value) })} /></label>
              <label>Unit<input className={fieldClass} required value={goal.unit} onChange={(e) => change(goal.id, { unit: e.target.value })} /></label>
              <label>Cadence<input className={fieldClass} value={goal.cadence} onChange={(e) => change(goal.id, { cadence: e.target.value })} /></label>
              <label>V6 workspace path<input className={fieldClass} placeholder="/research" value={goal.href} onChange={(e) => change(goal.id, { href: e.target.value })} /></label>
            </div>
            <fieldset className="flex flex-wrap gap-3">
              <legend>Responsible roles</legend>
              {options.roles.map((role) => <label key={role} className="flex items-center gap-2">
                <input type="checkbox" checked={goal.roles.includes(role)} onChange={(e) => change(goal.id, { roles: e.target.checked ? [...goal.roles, role] : goal.roles.filter((item) => item !== role) })} />
                {roleLabels[role] ?? role}
              </label>)}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={index === 0} onClick={() => moveUp(index)}>Move up</Button>
              <Button type="button" onClick={() => setEdits(goals.filter((item) => item.id !== goal.id))}>Remove</Button>
            </div>
          </>}
        </Card>)}
        <div className="flex flex-wrap gap-2">
          {!preview && <Button type="button" disabled={goals.length >= 100} onClick={() => setEdits([...goals, {
            id: crypto.randomUUID(), title: "", description: "", section: options.sections[0], target: 1,
            unit: "", cadence: "", roles: [], metric: options.metrics[0].id, href: "",
          }])}>Add goal</Button>}
          <Button type="button" onClick={() => setPreview(!preview)}>{preview ? "Back to editing" : "Preview draft"}</Button>
          <Button type="submit">Save draft</Button>
          <Button type="button" onClick={() => void save(true)}>Publish to all pods</Button>
        </div>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </form>
  </div>;
}
