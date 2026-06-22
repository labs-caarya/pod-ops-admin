import { useState } from "react";
import { Trash2, Share2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldRow } from "@/components/ui/Field";
import { jobStore } from "@/lib/data/collections";
import type { JobOpportunity, JobStatus, JobType } from "@/lib/types";

const TYPES: JobType[] = ["Internship", "Freelance", "Part-time", "Full-time", "Project"];
const STATUSES: JobStatus[] = ["Draft", "Open", "Shared", "Filled", "Closed"];
const MODES: JobOpportunity["workMode"][] = ["Remote", "Hybrid", "On-site"];
const SHARE_CHANNELS = ["Pod Board", "WhatsApp · SRCC", "Instagram", "LinkedIn", "College Notice Board"];

export function JobDrawer({
  job,
  isNew,
  onClose,
}: {
  job: JobOpportunity;
  isNew: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<JobOpportunity>(job);

  const set =
    <K extends keyof JobOpportunity>(key: K) =>
    (value: JobOpportunity[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const toggleChannel = (ch: string) => {
    setForm((f) => {
      const has = f.sharedChannels.includes(ch);
      const sharedChannels = has ? f.sharedChannels.filter((c) => c !== ch) : [...f.sharedChannels, ch];
      const status: JobStatus = sharedChannels.length && f.status === "Open" ? "Shared" : f.status;
      return { ...f, sharedChannels, status };
    });
  };

  const save = () => {
    const skills = Array.isArray(form.skills) ? form.skills : [];
    jobStore.upsert({ ...form, skills, postedAt: form.postedAt || new Date().toISOString() });
    onClose();
  };

  const remove = () => {
    if (!isNew) jobStore.remove(form.id);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "New opportunity" : form.title || "Opportunity"}
      subtitle={form.company}
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
        <FieldRow label="Title" className="col-span-2"><Input value={form.title} onChange={(e) => set("title")(e.target.value)} /></FieldRow>
        <FieldRow label="Company"><Input value={form.company} onChange={(e) => set("company")(e.target.value)} /></FieldRow>
        <FieldRow label="Type">
          <Select value={form.type} onChange={(e) => set("type")(e.target.value as JobType)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Status">
          <Select value={form.status} onChange={(e) => set("status")(e.target.value as JobStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Work mode">
          <Select value={form.workMode} onChange={(e) => set("workMode")(e.target.value as JobOpportunity["workMode"])}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FieldRow>
        <FieldRow label="Location"><Input value={form.location} onChange={(e) => set("location")(e.target.value)} /></FieldRow>
        <FieldRow label="Stipend"><Input value={form.stipend} onChange={(e) => set("stipend")(e.target.value)} /></FieldRow>
        <FieldRow label="Seats"><Input type="number" value={form.seats} onChange={(e) => set("seats")(Number(e.target.value))} /></FieldRow>
        <FieldRow label="Applicants"><Input type="number" value={form.applicants} onChange={(e) => set("applicants")(Number(e.target.value))} /></FieldRow>
        <FieldRow label="Skills (comma-separated)" className="col-span-2">
          <Input
            value={Array.isArray(form.skills) ? form.skills.join(", ") : ""}
            onChange={(e) => set("skills")(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </FieldRow>
        <FieldRow label="Description" className="col-span-2">
          <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} />
        </FieldRow>
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ruby-bright">
          <Share2 className="h-3.5 w-3.5" /> Share with students
        </p>
        <div className="flex flex-wrap gap-2">
          {SHARE_CHANNELS.map((ch) => {
            const active = form.sharedChannels.includes(ch);
            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={
                  active
                    ? "rounded-full border border-ruby/40 bg-ruby/15 px-3 py-1 text-xs font-medium text-ruby-bright"
                    : "rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-muted hover:border-line-strong"
                }
              >
                {ch}
              </button>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
