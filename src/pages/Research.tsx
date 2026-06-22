import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Microscope, Plus, Search, Send, Star, Globe } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Misc";
import { HiveAcronym } from "@/components/research/HiveAcronym";
import { useCollection } from "@/lib/store";
import { researchStore, contactStore } from "@/lib/data/collections";
import { computeScore } from "@/lib/data/scoring";
import { classBand } from "@/lib/utils";
import { RESEARCH_STATUSES, SEARCH_TARGETS, SEARCH_TARGET_TONE } from "@/lib/constants";
import { HIVE_NAME } from "@/lib/copy/hive";
import type { ResearchProfile, SearchTarget } from "@/lib/types";
import { contactFromResearch, normalizeResearch, searchTargetLabel } from "@/lib/data/transforms";

const bandTone: Record<string, Tone> = { ruby: "ruby", amber: "amber", info: "info", muted: "muted" };

export default function Research() {
  const research = useCollection(researchStore);
  const contacts = useCollection(contactStore);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState<SearchTarget | "all">("all");

  const linkedIds = useMemo(() => new Set(contacts.map((c) => c.researchId)), [contacts]);

  const rows = useMemo(() => {
    return research
      .map((r) => ({ ...normalizeResearch(r), score: computeScore(r.scores) }))
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (targetFilter !== "all" && r.searchTarget !== targetFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.sector.toLowerCase().includes(q) ||
          r.searchTarget.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [research, search, statusFilter, targetFilter]);

  const addToRolodex = (r: ResearchProfile) => {
    if (linkedIds.has(r.id)) return;
    contactStore.upsert(contactFromResearch(r));
    if (r.status === "Research" || r.status === "Scored") {
      researchStore.upsert({ id: r.id, status: "Outreach Sent" });
    }
  };

  return (
    <div>
      <PageHeader
        icon={Microscope}
        title={HIVE_NAME}
        description="Profile academic partners, campus companies, and industry targets. Strong leads get pushed into the Rolodex for outreach."
        actions={
          <Link to="/research/new">
            <Button>
              <Plus className="h-4 w-4" /> New profile
            </Button>
          </Link>
        }
      />
      <HiveAcronym className="-mt-4 mb-6" />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search brands or sectors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value as SearchTarget | "all")}
          className="w-full sm:w-48"
        >
          <option value="all">All targets</option>
          {SEARCH_TARGETS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        >
          <option value="all">All statuses</option>
          {RESEARCH_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Microscope}
          title="No profiles yet"
          description="Start profiling an academic partner, campus company, or industry target."
          action={
            <Link to="/research/new">
              <Button><Plus className="h-4 w-4" /> New profile</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const band = classBand(r.score);
            const linked = linkedIds.has(r.id);
            return (
              <Card key={r.id} hover className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/research/${r.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-base font-bold text-ink">{r.name}</h3>
                      <Badge tone={SEARCH_TARGET_TONE[r.searchTarget] ?? "muted"}>
                        {searchTargetLabel(r)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">{r.sector} · {r.city}</p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="font-display text-2xl font-black text-gradient">{r.score}</span>
                    <Badge tone={bandTone[band.tone]} className="mt-0.5 text-[10px]">{band.label}</Badge>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{r.offer || r.gaps || "No synthesis yet."}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                  <Badge tone="muted">{r.status}</Badge>
                  {r.founderActive && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber" /> Founder active
                    </span>
                  )}
                  {r.website && (
                    <a
                      href={`https://${r.website.replace(/^https?:\/\//, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-ink"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-3 w-3" /> {r.website}
                    </a>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row">
                  <Link to={`/research/${r.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Open profile</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={linked ? "outline" : "primary"}
                    disabled={linked}
                    onClick={() => addToRolodex(r)}
                    className="flex-1"
                  >
                    <Send className="h-3.5 w-3.5" /> {linked ? "In Rolodex" : "Add to Rolodex"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
