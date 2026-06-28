import { useState } from "react";
import { Palette, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Drawer";
import {
  assetInventory,
  componentStyleNotes,
  designTokens,
  interactionBehavior,
  layoutSystem,
  responsiveBehavior,
  typographySystem,
} from "@/theme/designSystem";

export default function AdminReference() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div>
      <PageHeader
        icon={Palette}
        title="Design Language Bible"
        description="Centralized tokens, typography, component patterns, layout rules, and interaction behavior copied from the original Pod Ops frontend for admin reuse."
      />

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-ink">Design tokens</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <TokenGroup title="Colors">
              {Object.entries(designTokens.colors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full border border-line" style={{ background: value }} />
                    <span className="text-sm text-ink">{key}</span>
                  </div>
                  <span className="text-xs text-ink-faint">{value}</span>
                </div>
              ))}
            </TokenGroup>

            <TokenGroup title="Type + spacing">
              {Object.entries({ ...designTokens.fontSizes, ...designTokens.spacing }).map(([key, value]) => (
                <TokenRow key={key} label={key} value={String(value)} />
              ))}
            </TokenGroup>

            <TokenGroup title="Radius + motion">
              {Object.entries({ ...designTokens.radius, ...designTokens.animations }).map(([key, value]) => (
                <TokenRow key={key} label={key} value={String(value)} />
              ))}
            </TokenGroup>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Typography</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Heading stack</p>
                <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-ink">Admin command display</h1>
                <h2 className="mt-2 font-display text-2xl font-bold text-ink">Section heading in the copied system</h2>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">Dense card title</h3>
              </div>
              <div className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="text-base text-ink">
                  Body copy stays warm, readable, and slightly editorial while control text remains disciplined and compact.
                </p>
                <p className="mt-2 text-sm text-ink-muted">Support text lands at 14px with a 1.5 line height.</p>
                <p className="mt-2 font-mono text-sm text-amber-bright">Metric / monospace utility samples live here.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(typographySystem.headingSizes).map(([key, value]) => (
                  <TokenRow key={key} label={key} value={value} />
                ))}
                {Object.entries(typographySystem.paragraphSizes).map(([key, value]) => (
                  <TokenRow key={key} label={key} value={value} />
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Component sheet</h2>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="rounded-2xl border border-line bg-surface-2 p-4">
                <p className="font-display text-lg font-bold text-ink">Card example</p>
                <p className="mt-1 text-sm text-ink-muted">Warm glass panel, thin border, restrained copy.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="ruby">Primary badge</Badge>
                  <Badge tone="amber">Warning</Badge>
                  <Badge tone="good">Healthy</Badge>
                  <Badge tone="muted">Muted</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Input placeholder="Input field styling" />
                <Select defaultValue="default">
                  <option value="default">Dropdown field styling</option>
                </Select>
                <Textarea placeholder="Textarea styling" />
              </div>
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                Preview modal / drawer
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-ink">System notes</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <TokenGroup title="Component style">
              {Object.entries(componentStyleNotes).map(([key, value]) => <TokenRow key={key} label={key} value={value} multiline />)}
            </TokenGroup>
            <TokenGroup title="Layout system">
              {Object.entries(layoutSystem).map(([key, value]) => <TokenRow key={key} label={key} value={value} multiline />)}
            </TokenGroup>
            <TokenGroup title="Interaction behavior">
              {Object.entries(interactionBehavior).map(([key, value]) => <TokenRow key={key} label={key} value={value} multiline />)}
            </TokenGroup>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Responsive behavior</h2>
            <div className="mt-4 space-y-3">
              {responsiveBehavior.map((entry) => (
                <div key={entry.width} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-base font-bold text-ink">{entry.width}</p>
                    <Badge tone="info">Target</Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{entry.behavior}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Assets</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(assetInventory).map(([key, value]) => (
                <TokenRow key={key} label={key} value={Array.isArray(value) ? value.join(", ") : String(value)} multiline />
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Reference drawer"
        subtitle="Modal language preserved from the original app"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-faint">Animation: fade + slide</span>
            <Button onClick={() => setDrawerOpen(false)}>Close preview</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ruby-bright" />
              <p className="font-display text-base font-bold text-ink">State sample</p>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Use this page as the reference surface before changing any future admin flows.
            </p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function TokenGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-base-2/60 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function TokenRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className={`mt-1 ${multiline ? "text-sm leading-relaxed text-ink-muted" : "text-sm text-ink"}`}>{value}</p>
    </div>
  );
}
