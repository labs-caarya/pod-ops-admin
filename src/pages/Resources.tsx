import { Link } from "react-router-dom";
import { ExternalLink, BookOpen, FileText, Video, Link2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ResourceItem {
  title: string;
  description: string;
  href: string;
  tag: string;
  external?: boolean;
}

interface ResourceSection {
  heading: string;
  icon: typeof BookOpen;
  items: ResourceItem[];
}

const SECTIONS: ResourceSection[] = [
  {
    heading: "Caarya & pod ops",
    icon: BookOpen,
    items: [
      {
        title: "What is a Caarya pod?",
        description: "How student pods research brands, place talent, and build the network.",
        href: "https://caarya.com",
        tag: "Guide",
        external: true,
      },
      {
        title: "Research HIVE playbook",
        description: "How to profile academic partners, campus companies, and industry targets — and when to push to Rolodex.",
        href: "/research",
        tag: "In-app",
      },
      {
        title: "Rolodex outreach stages",
        description: "From first contact to partner won — keep every conversation moving.",
        href: "/rolodex",
        tag: "In-app",
      },
    ],
  },
  {
    heading: "Templates & frameworks",
    icon: FileText,
    items: [
      {
        title: "First outreach email",
        description: "Short, specific opener referencing a gap you can fill — not a generic pitch deck ask.",
        href: "#",
        tag: "Template",
      },
      {
        title: "Sponsorship leverage one-pager",
        description: "Package academic partner assets (reach, formats, audience) for industry sponsors.",
        href: "/partners",
        tag: "In-app",
      },
      {
        title: "Campus company founder intro",
        description: "Warm intro script for student founders — talent placement + growth support angle.",
        href: "#",
        tag: "Template",
      },
    ],
  },
  {
    heading: "Learning & references",
    icon: Video,
    items: [
      {
        title: "Industry partner stages",
        description: "Idea stage → Early stage → Angel funded → Established brand — match your research and offer.",
        href: "/research/new",
        tag: "HIVE",
      },
      {
        title: "Ask Moksha",
        description: "In-app guide for anything about Caarya, this portal, or your pod workflow.",
        href: "/ask",
        tag: "AI",
      },
    ],
  },
  {
    heading: "Quick links",
    icon: Link2,
    items: [
      { title: "Partners dashboard", description: "Academic, campus companies, and industry relationships.", href: "/partners", tag: "In-app" },
      { title: "Talent Map", description: "Place students with partners and opportunities.", href: "/talent", tag: "In-app" },
      { title: "Opportunities", description: "Share internships, projects, and roles with your network.", href: "/opportunities", tag: "In-app" },
    ],
  },
];

export default function Resources() {
  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Resources"
        description="Playbooks, templates, and quick links for running your pod — research, outreach, talent, and partners."
      />

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <div className="mb-3 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-ruby-bright" />
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink-muted">
                {section.heading}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => {
                const isExternal = item.external || item.href.startsWith("http");
                return (
                  <Card key={item.title} hover className="flex flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-ink">{item.title}</h3>
                      <Badge tone="muted">{item.tag}</Badge>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-ink-muted">{item.description}</p>
                    <div className="mt-4 border-t border-line pt-3">
                      {item.href === "#" ? (
                        <span className="text-xs text-ink-faint">Coming soon</span>
                      ) : isExternal ? (
                        <a href={item.href} target="_blank" rel="noreferrer">
                          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                            Open <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      ) : (
                        <Link to={item.href}>
                          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                            Open
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
