import { useMemo, useState } from "react";
import { Trash2, Star } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow, Label } from "@/components/ui/Field";
import { Badge, type Tone } from "@/components/ui/Badge";
import { researchStore } from "@/lib/data/collections";
import { emptyResearch } from "@/lib/data/transforms";
import { SCORING_CRITERIA, computeScore } from "@/lib/data/scoring";
import { classBand } from "@/lib/utils";
import { RESEARCH_STATUSES } from "@/lib/constants";
import type { ResearchProfile, ResearchScores } from "@/lib/types";

const bandTone: Record<string, Tone> = { ruby: "ruby", amber: "amber", info: "info", muted: "muted" };

export function ResearchEditor({
  profile,
  onClose,
}: {
  profile: ResearchProfile | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ResearchProfile>(() => profile ?? emptyResearch());
  const isNew = !profile;

  const set =
    <K extends keyof ResearchProfile>(key: K) =>
    (value: ResearchProfile[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const setScore = (key: keyof ResearchScores, value: number) =>
    setForm((f) => ({ ...f, scores: { ...f.scores, [key]: value } }));

  const score = useMemo(() => computeScore(form.scores), [form.scores]);
  const band = classBand(score);

  const save = () => {
    let status = form.status;
    if (status === "Research" && score > 0) status = "Scored";
    researchStore.upsert({ ...form, status });
    onClose();
  };

  const remove = () => {
    if (!isNew) researchStore.remove(form.id);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New research" : form.name || "Research"}
      subtitle={isNew ? "Profile a startup or brand" : `${form.sector} · ${form.city}`}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between">
          {!isNew ? (
            <Button variant="danger" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save}>Save research</Button>
          </div>
        </div>
      }
    >
      {/* Live score banner */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-line bg-gradient-to-br from-surface-2 to-base p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">Weighted score</p>
          <p className="font-display text-3xl font-black text-gradient">{score}<span className="text-base text-ink-faint">/100</span></p>
        </div>
        <Badge tone={bandTone[band.tone]}>{band.label}</Badge>
      </div>

      <Section title="Identity">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Name"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} /></FieldRow>
          <FieldRow label="Type">
            <Select value={form.kind} onChange={(e) => set("kind")(e.target.value as ResearchProfile["kind"])}>
              <option value="Brand">Brand</option>
              <option value="Startup">Startup</option>
            </Select>
          </FieldRow>
          <FieldRow label="Sector"><Input value={form.sector} onChange={(e) => set("sector")(e.target.value)} /></FieldRow>
          <FieldRow label="City"><Input value={form.city} onChange={(e) => set("city")(e.target.value)} /></FieldRow>
          <FieldRow label="Website"><Input value={form.website} onChange={(e) => set("website")(e.target.value)} placeholder="brand.com" /></FieldRow>
          <FieldRow label="Status">
            <Select value={form.status} onChange={(e) => set("status")(e.target.value as ResearchProfile["status"])}>
              {RESEARCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FieldRow>
        </div>
      </Section>

      <Section title="Founder & social">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Founder"><Input value={form.founderName} onChange={(e) => set("founderName")(e.target.value)} /></FieldRow>
          <FieldRow label="Funding stage"><Input value={form.fundingStage} onChange={(e) => set("fundingStage")(e.target.value)} /></FieldRow>
          <FieldRow label="Instagram followers"><Input value={form.instagramFollowers} onChange={(e) => set("instagramFollowers")(e.target.value)} /></FieldRow>
          <FieldRow label="LinkedIn followers"><Input value={form.linkedinFollowers} onChange={(e) => set("linkedinFollowers")(e.target.value)} /></FieldRow>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.founderActive}
            onChange={(e) => set("founderActive")(e.target.checked)}
            className="h-4 w-4 accent-[#e11d48]"
          />
          <Star className="h-4 w-4 text-amber" /> Founder is active online (warmer outreach)
        </label>
      </Section>

      <Section title="Synthesis">
        <FieldRow label="Gaps we can fill"><Textarea value={form.gaps} onChange={(e) => set("gaps")(e.target.value)} /></FieldRow>
        <FieldRow label="Our offer / angle" className="mt-3"><Textarea value={form.offer} onChange={(e) => set("offer")(e.target.value)} /></FieldRow>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FieldRow label="Open roles (hiring signal)"><Input value={form.openRoles} onChange={(e) => set("openRoles")(e.target.value)} /></FieldRow>
          <FieldRow label="Verdict"><Input value={form.verdict} onChange={(e) => set("verdict")(e.target.value)} /></FieldRow>
        </div>
      </Section>

      <Section title="Scoring">
        <div className="space-y-3">
          {SCORING_CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between">
                <Label className="mb-0">{c.label} <span className="text-ink-faint">·×{c.weight}</span></Label>
                <span className="font-display text-sm font-bold text-amber-bright">{form.scores[c.key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={form.scores[c.key]}
                onChange={(e) => setScore(c.key, Number(e.target.value))}
                className="w-full accent-[#e11d48]"
              />
              <p className="mt-0.5 text-[11px] text-ink-faint">{c.hint}</p>
            </div>
          ))}
        </div>
      </Section>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ruby-bright">{title}</h3>
      {children}
    </div>
  );
}
