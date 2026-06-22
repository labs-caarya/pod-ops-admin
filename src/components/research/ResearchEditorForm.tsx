import { useMemo, useState } from "react";
import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow, Label } from "@/components/ui/Field";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { researchStore } from "@/lib/data/collections";
import { SCORING_CRITERIA, computeScore } from "@/lib/data/scoring";
import { classBand } from "@/lib/utils";
import { INDUSTRY_PARTNER_STAGES, RESEARCH_STATUSES, SEARCH_TARGETS } from "@/lib/constants";
import { kindFromIndustryStage, normalizeResearch } from "@/lib/data/transforms";
import type { IndustryPartnerStage, ResearchProfile, ResearchScores, SearchTarget } from "@/lib/types";

const bandTone: Record<string, Tone> = { ruby: "ruby", amber: "amber", info: "info", muted: "muted" };

interface ResearchEditorFormProps {
  initial: ResearchProfile;
  isNew: boolean;
  onSave: (saved: ResearchProfile) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ResearchEditorForm({
  initial,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: ResearchEditorFormProps) {
  const [form, setForm] = useState<ResearchProfile>(() => normalizeResearch(initial));

  const set =
    <K extends keyof ResearchProfile>(key: K) =>
    (value: ResearchProfile[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const setSearchTarget = (target: SearchTarget) => {
    setForm((f) => {
      const next: ResearchProfile = { ...f, searchTarget: target };
      if (target === "Industry Partner") {
        next.industryStage = f.industryStage ?? "Early stage startup";
        next.kind = kindFromIndustryStage(next.industryStage);
      } else {
        next.industryStage = undefined;
        next.kind = target === "Campus Company" ? "Startup" : "Brand";
      }
      return next;
    });
  };

  const setIndustryStage = (stage: IndustryPartnerStage) => {
    setForm((f) => ({
      ...f,
      industryStage: stage,
      kind: kindFromIndustryStage(stage),
    }));
  };

  const setScore = (key: keyof ResearchScores, value: number) =>
    setForm((f) => ({ ...f, scores: { ...f.scores, [key]: value } }));

  const score = useMemo(() => computeScore(form.scores), [form.scores]);
  const band = classBand(score);

  const save = () => {
    let status = form.status;
    if (status === "Research" && score > 0) status = "Scored";
    const payload = normalizeResearch({ ...form, status });
    const saved = researchStore.upsert(payload);
    onSave(saved);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-6">
        <Section title="What are you researching?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="Search target" className="sm:col-span-2">
              <Select
                value={form.searchTarget}
                onChange={(e) => setSearchTarget(e.target.value as SearchTarget)}
              >
                {SEARCH_TARGETS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                {form.searchTarget === "Academic Partner" &&
                  "Clubs, councils, and college communities you want to partner with."}
                {form.searchTarget === "Campus Company" &&
                  "Startups run by students — founders still in college."}
                {form.searchTarget === "Industry Partner" &&
                  "External brands and startups outside the campus ecosystem."}
              </p>
            </FieldRow>
            {form.searchTarget === "Industry Partner" && (
              <FieldRow label="Industry type" className="sm:col-span-2">
                <Select
                  value={form.industryStage ?? "Early stage startup"}
                  onChange={(e) => setIndustryStage(e.target.value as IndustryPartnerStage)}
                >
                  {INDUSTRY_PARTNER_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FieldRow>
            )}
          </div>
        </Section>

        <Section title="Identity">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="Name"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} /></FieldRow>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="Open roles (hiring signal)"><Input value={form.openRoles} onChange={(e) => set("openRoles")(e.target.value)} /></FieldRow>
            <FieldRow label="Verdict"><Input value={form.verdict} onChange={(e) => set("verdict")(e.target.value)} /></FieldRow>
          </div>
        </Section>

        <Section title="Scoring">
          <div className="space-y-4">
            {SCORING_CRITERIA.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          {!isNew && onDelete ? (
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button onClick={save}>Save profile</Button>
          </div>
        </div>
      </div>

      {/* Score sidebar — sticky on desktop, inline on mobile */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Weighted score</p>
          <p className="mt-1 font-display text-4xl font-black text-gradient">
            {score}
            <span className="text-lg text-ink-faint">/100</span>
          </p>
          <Badge tone={bandTone[band.tone]} className="mt-3">{band.label}</Badge>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Score bands: 80+ Priority · 60–79 Strong · 40–59 Watchlist · below 40 Skip
          </p>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-ruby-bright">{title}</h3>
      {children}
    </Card>
  );
}
