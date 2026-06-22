import { useMemo, useState } from "react";
import { Contact2, Plus, Search, AlertCircle, CheckCircle2, Users2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useCollection } from "@/lib/store";
import { contactStore } from "@/lib/data/collections";
import { OUTREACH_STAGES } from "@/lib/constants";
import { relativeDays } from "@/lib/utils";
import type { Contact, OutreachStage } from "@/lib/types";
import { ContactDrawer } from "@/components/rolodex/ContactDrawer";
import { makeId } from "@/lib/utils";

const ACTIVE: OutreachStage[] = ["in_conversation", "meeting", "proposal"];

export default function Rolodex() {
  const contacts = useCollection(contactStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const stats = useMemo(() => {
    const active = contacts.filter((c) => ACTIVE.includes(c.stage)).length;
    const won = contacts.filter((c) => c.stage === "partner").length;
    const due = contacts.filter((c) => {
      if (c.stage === "partner" || c.stage === "passed") return false;
      const d = relativeDays(c.nextActionDate);
      return d !== null && d <= 0;
    }).length;
    return { active, won, due };
  }, [contacts]);

  const board = useMemo(
    () =>
      OUTREACH_STAGES.map((stage) => ({
        ...stage,
        items: filtered.filter((c) => c.stage === stage.key),
      })),
    [filtered],
  );

  const move = (contact: Contact, stage: OutreachStage) => {
    contactStore.upsert({ id: contact.id, stage });
  };

  const emptyContact = (): Contact => ({
    id: makeId("con"),
    researchId: "",
    company: "",
    sector: "",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    linkedin: "",
    channel: "LinkedIn",
    stage: "to_contact",
    hypothesis: "",
    nextAction: "",
    nextActionDate: "",
    owner: "",
    notes: [],
  });

  return (
    <div>
      <PageHeader
        icon={Contact2}
        title="Rolodex"
        description="Track and run outreach to brands & founders. Move cards across the pipeline as conversations progress."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add contact
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Contacts" value={contacts.length} icon={Users2} tone="ruby" />
        <StatCard label="In conversation" value={stats.active} icon={Contact2} tone="amber" />
        <StatCard label="Follow-ups due" value={stats.due} icon={AlertCircle} tone={stats.due ? "bad" : "good"} />
        <StatCard label="Partners won" value={stats.won} icon={CheckCircle2} tone="good" />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {board.map((col) => (
          <div key={col.key} className="flex w-72 shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{col.label}</span>
                <Badge tone={col.tone}>{col.items.length}</Badge>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-line bg-base-2/50 p-2">
              {col.items.length === 0 && (
                <div className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-ink-faint">
                  Empty
                </div>
              )}
              {col.items.map((c) => {
                const days = relativeDays(c.nextActionDate);
                const overdue = days !== null && days <= 0 && c.stage !== "partner" && c.stage !== "passed";
                return (
                  <div
                    key={c.id}
                    className="card card-hover cursor-pointer p-3"
                    onClick={() => setEditing(c)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-ink">{c.company}</p>
                      <Badge tone="muted" className="text-[10px]">{c.channel}</Badge>
                    </div>
                    {c.contactName && (
                      <p className="truncate text-xs text-ink-muted">
                        {c.contactName}{c.contactRole ? ` · ${c.contactRole}` : ""}
                      </p>
                    )}
                    {c.nextAction && (
                      <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{c.nextAction}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {c.nextActionDate ? (
                        <span className={`text-[11px] ${overdue ? "text-bad" : "text-ink-faint"}`}>
                          {overdue ? "Due" : "Next"}: {c.nextActionDate}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-faint">No next step</span>
                      )}
                      <select
                        value={c.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => move(c, e.target.value as OutreachStage)}
                        className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-muted focus:outline-none"
                      >
                        {OUTREACH_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ContactDrawer
          contact={editing === "new" ? emptyContact() : editing}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
