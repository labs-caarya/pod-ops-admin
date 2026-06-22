import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Factory,
  Mail,
  Phone,
  Users2,
  IndianRupee,
  Pencil,
  Rocket,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Misc";
import { useCollection } from "@/lib/store";
import { partnerStore, talentStore } from "@/lib/data/collections";
import { buildLeverageSnapshot } from "@/lib/data/sponsorshipLeverage";
import { PARTNER_STAGE_TONE } from "@/lib/constants";
import { makeId } from "@/lib/utils";
import type { SponsorshipAsset, TalentMember } from "@/lib/types";
import { PartnerDrawer } from "@/components/partners/PartnerDrawer";
import { SponsorshipLeverageDashboard } from "@/components/partners/SponsorshipLeverageDashboard";
import { TalentDrawer } from "@/components/talent/TalentDrawer";
import { TalentGrid } from "@/components/talent/TalentGrid";

type Tab = "overview" | "leverage" | "talent";

export default function PartnerDetail() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const partners = useCollection(partnerStore);
  const talent = useCollection(talentStore);
  const partner = partners.find((p) => p.id === partnerId);

  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [talentEditing, setTalentEditing] = useState<TalentMember | "new" | null>(null);

  const partnerTalent = useMemo(
    () => talent.filter((t) => t.partnerId === partnerId),
    [talent, partnerId],
  );

  if (!partner) {
    return (
      <EmptyState
        icon={Building2}
        title="Partner not found"
        description="This partner may have been removed."
        action={<Link to="/partners"><Button>Back to partners</Button></Link>}
      />
    );
  }

  const isAcademic = partner.type === "Academic";
  const isCampusCompany = partner.type === "Campus Company";
  const PartnerIcon = isAcademic ? GraduationCap : isCampusCompany ? Rocket : Factory;
  const typeTone = isAcademic ? "ruby" : isCampusCompany ? "info" : "amber";

  const leverageSnapshot = isAcademic
    ? buildLeverageSnapshot(partner, partnerTalent)
    : null;

  const updateAsset = (id: string, patch: Partial<SponsorshipAsset>) => {
    partnerStore.upsert({
      id: partner.id,
      sponsorshipAssets: partner.sponsorshipAssets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };
  const removeAsset = (id: string) => {
    partnerStore.upsert({ id: partner.id, sponsorshipAssets: partner.sponsorshipAssets.filter((a) => a.id !== id) });
  };
  const addAsset = () => {
    const asset: SponsorshipAsset = {
      id: makeId("sa"),
      label: "New sponsorship asset",
      value: 50000,
      audience: 500,
      format: "On-ground",
      status: "Available",
    };
    partnerStore.upsert({ id: partner.id, sponsorshipAssets: [...partner.sponsorshipAssets, asset] });
  };
  const enableSponsorship = () => partnerStore.upsert({ id: partner.id, sponsorshipEnabled: true });

  const newTalent = (): TalentMember => ({
    id: makeId("tal"),
    name: "",
    college: partner.name,
    partnerId: partner.id,
    primarySkill: "",
    skills: [],
    talentRole: "Content Creator",
    serviceOfferings: [],
    level: "Explorer",
    status: "Available",
    availability: "",
  });

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "leverage", label: "Sponsorship Leverage", show: isAcademic },
    { key: "talent", label: "Talent Map", show: isAcademic },
  ];

  return (
    <div>
      <Link to="/partners" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All partners
      </Link>

      <PageHeader
        icon={PartnerIcon}
        title={partner.name}
        description={
          isAcademic
            ? `${partner.kind} · ${partner.city} · Capability & talent dashboard for industry sponsors`
            : `${partner.kind} · ${partner.city}`
        }
        actions={
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={PARTNER_STAGE_TONE[partner.stage] ?? "muted"}>{partner.stage}</Badge>
        <Badge tone={typeTone}>{partner.type}</Badge>
        {partner.tags.map((t) => <Badge key={t} tone="muted">{t}</Badge>)}
      </div>

      <div className="mb-5 flex gap-1 border-b border-line">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "relative -mb-px border-b-2 border-ruby px-4 py-2.5 text-sm font-semibold text-ink"
                : "border-b-2 border-transparent px-4 py-2.5 text-sm text-ink-muted hover:text-ink"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-display text-lg font-bold text-ink">About</h3>
            <p className="mt-2 text-sm text-ink-muted">{partner.description || "No description yet."}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Info label="Owner" value={partner.owner || "—"} />
              <Info label="Members" value={partner.memberCount ? String(partner.memberCount) : "—"} />
              <Info label="Contact" value={partner.contactName ? `${partner.contactName} · ${partner.contactRole}` : "—"} />
              <Info label="Stage" value={partner.stage} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {partner.email && (
                <a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink hover:border-line-strong">
                  <Mail className="h-4 w-4 text-ruby-bright" /> {partner.email}
                </a>
              )}
              {partner.phone && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm text-ink">
                  <Phone className="h-4 w-4 text-amber-bright" /> {partner.phone}
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-lg font-bold text-ink">At a glance</h3>
            <div className="mt-3 space-y-3">
              <Info label="Type" value={`${partner.type} · ${partner.kind}`} />
              {isAcademic && leverageSnapshot && (
                <>
                  <Info label="Students mapped" value={String(leverageSnapshot.mappedTalent)} />
                  <Info label="Services ready" value={String(leverageSnapshot.activeServices)} />
                  <Info
                    label="Sponsorship inventory"
                    value={partner.sponsorshipEnabled ? `₹${(leverageSnapshot.totalLeverage / 100000).toFixed(1)}L` : "Not enabled"}
                  />
                  <Info label="Combined reach" value={leverageSnapshot.totalAudience.toLocaleString("en-IN")} />
                </>
              )}
            </div>
            {isAcademic && (
              <div className="mt-4 flex flex-col gap-2">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => setTab("leverage")}>
                  <IndianRupee className="h-4 w-4" /> Sponsorship leverage dashboard
                </Button>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => setTab("talent")}>
                  <Users2 className="h-4 w-4" /> Talent map
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "leverage" && isAcademic && (
        <SponsorshipLeverageDashboard
          partner={partner}
          partnerTalent={partnerTalent}
          onEnable={enableSponsorship}
          onAddAsset={addAsset}
          onUpdateAsset={updateAsset}
          onRemoveAsset={removeAsset}
          onOpenTalentMap={() => setTab("talent")}
        />
      )}

      {tab === "talent" && isAcademic && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">{partner.name} · Talent map</h3>
              <p className="text-sm text-ink-muted">Students from this academic partner — manage roster, skills and availability.</p>
            </div>
            <Button onClick={() => setTalentEditing("new")}>
              <Plus className="h-4 w-4" /> Add student
            </Button>
          </div>
          <TalentGrid members={partnerTalent} onOpen={(m) => setTalentEditing(m)} />
        </div>
      )}

      {editing && (
        <PartnerDrawer
          partner={partner}
          isNew={false}
          onClose={() => {
            setEditing(false);
            if (!partnerStore.get(partner.id)) navigate("/partners");
          }}
        />
      )}
      {talentEditing && (
        <TalentDrawer
          member={talentEditing === "new" ? newTalent() : talentEditing}
          isNew={talentEditing === "new"}
          onClose={() => setTalentEditing(null)}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
