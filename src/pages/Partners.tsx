import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {

  Building2,

  Plus,

  Search,

  GraduationCap,

  Factory,

  Rocket,

  Users2,

  IndianRupee,

  ArrowRight,

} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";

import { StatCard } from "@/components/ui/StatCard";

import { Card } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Field";

import { useCollection } from "@/lib/store";

import { partnerStore } from "@/lib/data/collections";

import { PARTNER_STAGE_TONE } from "@/lib/constants";

import { cn, makeId } from "@/lib/utils";

import type { Partner, PartnerType } from "@/lib/types";

import { PartnerDrawer } from "@/components/partners/PartnerDrawer";



type PartnerTab = PartnerType;



const TAB_COPY: Record<PartnerTab, { description: string; addLabel: string }> = {
  Academic: {
    description:
      "Clubs, councils and college communities — open one to manage sponsorship leverage and its talent map.",
    addLabel: "Add academic partner",
  },
  Industry: {
    description: "Companies, incubators and industry relationships your pod is building.",
    addLabel: "Add industry partner",
  },
  "Campus Company": {
    description:
      "Startups run by students — founders still in college. Track pipeline, founders, and placement opportunities.",
    addLabel: "Add campus company",
  },
};



const TAB_ICON = {

  Academic: GraduationCap,

  Industry: Factory,

  "Campus Company": Rocket,

} as const;



export default function Partners() {

  const partners = useCollection(partnerStore);

  const [tab, setTab] = useState<PartnerTab>("Academic");

  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Partner | null>(null);

  const [isNewPartner, setIsNewPartner] = useState(false);



  const filtered = useMemo(() => {

    return partners.filter((p) => {

      if (p.type !== tab) return false;

      if (!search) return true;

      const q = search.toLowerCase();

      return (

        p.name.toLowerCase().includes(q) ||

        p.kind.toLowerCase().includes(q) ||

        p.city.toLowerCase().includes(q)

      );

    });

  }, [partners, search, tab]);



  const stats = useMemo(() => {

    const academic = partners.filter((p) => p.type === "Academic").length;

    const industry = partners.filter((p) => p.type === "Industry").length;

    const campusCompany = partners.filter((p) => p.type === "Campus Company").length;

    const leverage = partners

      .filter((p) => p.sponsorshipEnabled)

      .reduce((sum, p) => sum + p.sponsorshipAssets.reduce((s, a) => s + a.value, 0), 0);

    return { academic, industry, campusCompany, leverage };

  }, [partners]);



  const newPartner = (type: PartnerType): Partner => ({

    id: makeId("par"),

    name: "",

    type,

    kind:

      type === "Academic" ? "Club" : type === "Campus Company" ? "Student Startup" : "Company",

    city: "",

    stage: "Prospect",

    owner: "",

    memberCount: 0,

    description: "",

    contactName: "",

    contactRole: "",

    email: "",

    phone: "",

    sponsorshipEnabled: type === "Academic",

    sponsorshipAssets: [],

    tags: [],

  });



  const tabs: { key: PartnerTab; label: string; icon: typeof GraduationCap; count: number }[] = [

    { key: "Academic", label: "Academic", icon: GraduationCap, count: stats.academic },

    { key: "Campus Company", label: "Campus Companies", icon: Rocket, count: stats.campusCompany },

    { key: "Industry", label: "Industry", icon: Factory, count: stats.industry },

  ];

  return (

    <div>

      <PageHeader

        icon={Building2}

        title="Partners"

        description={TAB_COPY[tab].description}

        actions={

          <Button

            onClick={() => {

              setEditing(newPartner(tab));

              setIsNewPartner(true);

            }}

          >

            <Plus className="h-4 w-4" /> {TAB_COPY[tab].addLabel}

          </Button>

        }

      />



      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard label="Academic partners" value={stats.academic} icon={GraduationCap} tone="ruby" hint="Clubs & councils" />

        <StatCard label="Campus companies" value={stats.campusCompany} icon={Rocket} tone="ruby" hint="Student startups" />

        <StatCard label="Industry partners" value={stats.industry} icon={Factory} tone="amber" />

        <StatCard

          label="Sponsorship leverage"

          value={`₹${(stats.leverage / 100000).toFixed(1)}L`}

          icon={IndianRupee}

          tone="good"

          hint="Academic partners"

        />

      </div>



      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">

        {tabs.map((t) => (

          <button

            key={t.key}

            onClick={() => setTab(t.key)}

            className={cn(

              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",

              tab === t.key

                ? "border-ruby text-ink"

                : "border-transparent text-ink-muted hover:text-ink",

            )}

          >

            <t.icon className="h-4 w-4" />

            {t.label}

            <span

              className={cn(

                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",

                tab === t.key ? "bg-ruby/15 text-ruby-bright" : "bg-surface-3 text-ink-faint",

              )}

            >

              {t.count}

            </span>

          </button>

        ))}

      </div>



      <div className="mb-4">

        <div className="relative w-full sm:max-w-md">

          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />

          <Input

            placeholder={`Search ${tab.toLowerCase()} partners…`}

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="pl-9"

          />

        </div>

      </div>



      {filtered.length === 0 ? (

        <Card className="p-10 text-center">

          <p className="font-display font-bold text-ink">No {tab.toLowerCase()} partners yet</p>

          <p className="mt-1 text-sm text-ink-muted">{TAB_COPY[tab].addLabel}</p>

          <Button

            className="mt-4"

            onClick={() => {

              setEditing(newPartner(tab));

              setIsNewPartner(true);

            }}

          >

            <Plus className="h-4 w-4" /> Add partner

          </Button>

        </Card>

      ) : (

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

          {filtered.map((p) => {

            const leverage = p.sponsorshipAssets.reduce((s, a) => s + a.value, 0);

            const Icon = TAB_ICON[p.type];

            const iconStyle =

              p.type === "Academic"

                ? "bg-ruby/10 text-ruby-bright"

                : p.type === "Campus Company"

                  ? "bg-ruby/10 text-amber-bright"

                  : "bg-amber/10 text-amber-bright";



            return (

              <Card key={p.id} hover className="flex flex-col p-4">

                <div className="flex items-start justify-between gap-2">

                  <div className="flex min-w-0 items-start gap-3">

                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconStyle)}>

                      <Icon className="h-5 w-5" />

                    </div>

                    <div className="min-w-0">

                      <h3 className="truncate font-display font-bold text-ink">{p.name}</h3>

                      <p className="truncate text-xs text-ink-muted">{p.kind} · {p.city}</p>

                    </div>

                  </div>

                  <Badge tone={PARTNER_STAGE_TONE[p.stage] ?? "muted"}>{p.stage}</Badge>

                </div>



                <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{p.description}</p>



                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">

                  {p.memberCount > 0 && (

                    <span className="flex items-center gap-1">

                      <Users2 className="h-3 w-3" /> {p.memberCount} members

                    </span>

                  )}

                  {p.sponsorshipEnabled && (

                    <Badge tone="good">Leverage ₹{(leverage / 100000).toFixed(1)}L</Badge>

                  )}

                </div>



                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row">

                  <Button

                    variant="secondary"

                    size="sm"

                    className="flex-1"

                    onClick={() => {

                      setEditing(p);

                      setIsNewPartner(false);

                    }}

                  >

                    Edit

                  </Button>

                  <Link to={`/partners/${p.id}`} className="flex-1">

                    <Button size="sm" className="w-full">

                      Open <ArrowRight className="h-3.5 w-3.5" />

                    </Button>

                  </Link>

                </div>

              </Card>

            );

          })}

        </div>

      )}



      {editing && (

        <PartnerDrawer

          partner={editing}

          isNew={isNewPartner}

          onClose={() => {

            setEditing(null);

            setIsNewPartner(false);

          }}

        />

      )}

    </div>

  );

}

