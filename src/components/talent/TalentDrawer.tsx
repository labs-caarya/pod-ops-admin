import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Select, FieldRow, Textarea, Label } from "@/components/ui/Field";
import { talentStore, partnerStore } from "@/lib/data/collections";
import { ALL_POD_SERVICES, POD_SERVICE_GROUPS, TALENT_ROLES, normalizeTalent } from "@/lib/data/services";
import type { PodServiceId, TalentMember } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: TalentMember["level"][] = ["Explorer", "Builder", "Specialist", "Lead"];
const STATUSES: TalentMember["status"][] = ["Available", "Engaged", "Placed", "Bench"];

export function TalentDrawer({
  member,
  isNew,
  onClose,
}: {
  member: TalentMember;
  isNew: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TalentMember>(() => normalizeTalent(member));
  const partners = partnerStore.all().filter((p) => p.type === "Academic");

  const set =
    <K extends keyof TalentMember>(key: K) =>
    (value: TalentMember[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const toggleService = (id: PodServiceId) => {
    setForm((f) => {
      const current = f.serviceOfferings ?? [];
      const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
      return { ...f, serviceOfferings: next };
    });
  };

  const save = () => {
    const skills = Array.isArray(form.skills)
      ? form.skills
      : String(form.skills).split(",").map((s) => s.trim()).filter(Boolean);
    talentStore.upsert(normalizeTalent({ ...form, skills }));
    onClose();
  };

  const remove = () => {
    if (!isNew) talentStore.remove(form.id);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "Add talent" : form.name}
      subtitle={form.talentRole ? `${form.talentRole} · ${form.primarySkill}` : form.primarySkill}
      footer={
        <div className="flex items-center justify-between">
          {!isNew ? (
            <Button variant="danger" size="sm" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Name"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} /></FieldRow>
        <FieldRow label="College"><Input value={form.college} onChange={(e) => set("college")(e.target.value)} /></FieldRow>
        <FieldRow label="Primary skill"><Input value={form.primarySkill} onChange={(e) => set("primarySkill")(e.target.value)} /></FieldRow>
        <FieldRow label="Talent role">
          <Select value={form.talentRole} onChange={(e) => set("talentRole")(e.target.value as TalentMember["talentRole"])}>
            {TALENT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Level">
          <Select value={form.level} onChange={(e) => set("level")(e.target.value as TalentMember["level"])}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Status">
          <Select value={form.status} onChange={(e) => set("status")(e.target.value as TalentMember["status"])}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Availability"><Input value={form.availability} onChange={(e) => set("availability")(e.target.value)} /></FieldRow>
        <FieldRow label="Academic partner" className="col-span-2">
          <Select value={form.partnerId || ""} onChange={(e) => set("partnerId")(e.target.value || undefined)}>
            <option value="">— Pod's own talent —</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Skills (comma-separated)" className="col-span-2">
          <Input
            value={Array.isArray(form.skills) ? form.skills.join(", ") : form.skills}
            onChange={(e) => set("skills")(e.target.value.split(",").map((s) => s.trim()) as string[])}
          />
        </FieldRow>

        <div className="col-span-2">
          <Label>Services opted in</Label>
          <p className="mb-2 text-[11px] text-ink-faint">Which pod services this student will help deliver.</p>
          <div className="space-y-3">
            {POD_SERVICE_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.services.map((svc) => {
                    const active = (form.serviceOfferings ?? []).includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                          active
                            ? "border-ruby/50 bg-ruby/15 text-ruby-bright"
                            : "border-line bg-surface-2 text-ink-muted hover:border-line-strong",
                        )}
                      >
                        {svc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {ALL_POD_SERVICES.length > 0 && (form.serviceOfferings ?? []).length === 0 && (
            <p className="mt-2 text-[11px] text-bad">Select at least one service.</p>
          )}
        </div>

        <FieldRow label="Placed at" className="col-span-2">
          <Input value={form.placedAt || ""} onChange={(e) => set("placedAt")(e.target.value)} placeholder="e.g. Zomato District activation" />
        </FieldRow>
        <FieldRow label="Notes" className="col-span-2">
          <Textarea value={form.notes || ""} onChange={(e) => set("notes")(e.target.value)} />
        </FieldRow>
      </div>
    </Drawer>
  );
}
