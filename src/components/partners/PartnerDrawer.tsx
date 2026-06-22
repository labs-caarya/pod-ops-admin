import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow } from "@/components/ui/Field";
import { partnerStore } from "@/lib/data/collections";
import type { Partner, PartnerKind, PartnerStage, PartnerType } from "@/lib/types";

const TYPES: PartnerType[] = ["Academic", "Campus Company", "Industry"];
const KINDS: PartnerKind[] = ["Club", "Council", "College", "Company", "Incubator", "Community", "Student Startup"];
const STAGES: PartnerStage[] = ["Prospect", "Engaged", "Active", "Strategic"];

export function PartnerDrawer({
  partner,
  isNew,
  onClose,
}: {
  partner: Partner;
  isNew: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partner>(partner);

  const set =
    <K extends keyof Partner>(key: K) =>
    (value: Partner[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    partnerStore.upsert(form);
    onClose();
  };
  const remove = () => {
    if (!isNew) partnerStore.remove(form.id);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "Add partner" : form.name}
      subtitle={`${form.type} · ${form.kind}`}
      width="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          {!isNew ? (
            <Button variant="danger" size="sm" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</Button>
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
        <FieldRow label="Name" className="col-span-2"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} /></FieldRow>
        <FieldRow label="Type">
          <Select
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as PartnerType;
              setForm((f) => ({
                ...f,
                type,
                kind:
                  type === "Academic"
                    ? "Club"
                    : type === "Campus Company"
                      ? "Student Startup"
                      : "Company",
                sponsorshipEnabled: type === "Academic" ? f.sponsorshipEnabled : false,
              }));
            }}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Kind">
          <Select value={form.kind} onChange={(e) => set("kind")(e.target.value as PartnerKind)}>
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Stage">
          <Select value={form.stage} onChange={(e) => set("stage")(e.target.value as PartnerStage)}>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="City"><Input value={form.city} onChange={(e) => set("city")(e.target.value)} /></FieldRow>
        <FieldRow label="Members"><Input type="number" value={form.memberCount} onChange={(e) => set("memberCount")(Number(e.target.value))} /></FieldRow>
        <FieldRow label="Owner"><Input value={form.owner} onChange={(e) => set("owner")(e.target.value)} /></FieldRow>
        <FieldRow label="Contact name"><Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} /></FieldRow>
        <FieldRow label="Contact role"><Input value={form.contactRole} onChange={(e) => set("contactRole")(e.target.value)} /></FieldRow>
        <FieldRow label="Email"><Input value={form.email} onChange={(e) => set("email")(e.target.value)} /></FieldRow>
        <FieldRow label="Phone"><Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} /></FieldRow>
        <FieldRow label="Description" className="col-span-2">
          <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} />
        </FieldRow>
      </div>

      {form.type === "Academic" && (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.sponsorshipEnabled}
            onChange={(e) => set("sponsorshipEnabled")(e.target.checked)}
            className="h-4 w-4 accent-[#e11d48]"
          />
          Enable Sponsorship Leverage dashboard for this partner
        </label>
      )}
    </Drawer>
  );
}
