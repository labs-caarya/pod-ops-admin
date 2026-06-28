import { useState } from "react";
import { ShieldCheck, LockKeyhole, UserRoundCog } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { accessEvents, accessRoles } from "@/lib/admin/demoData";

export default function AdminIAM() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        icon={UserRoundCog}
        title="Team Access"
        description="Manage who can view, update, approve, or export pod work without exposing internal security jargon to end users."
        actions={<Button onClick={() => setOpen(true)}>Open approval drawer</Button>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-xl bg-ruby/10 p-3 text-ruby-bright">
              <ShieldCheck className="h-5 w-5" />
            </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Role coverage</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Keep access readable: who can run the pod, who can approve actions, and who should stay read-only.
                </p>
              </div>
            </div>
          <div className="space-y-3">
            {accessRoles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-bold text-ink">{role.role}</p>
                    <p className="text-xs text-ink-muted">{role.scope}</p>
                  </div>
                  <Badge tone="info">{role.users} users</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.criticalScopes.map((scope) => (
                    <Badge key={scope} tone="muted">{scope}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-amber/10 p-3 text-amber-bright">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Approval policy</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Extra access should be time-boxed, pod-scoped, and checked against sponsor and ops risk.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-ink-muted">
              <p>1. Pod leads should not keep permanent cross-pod export access.</p>
              <p>2. Partner viewers should never see contact details or internal controls.</p>
              <p>3. Sensitive approvals should be reviewed by two internal leads.</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold text-ink">Recent access events</h2>
            <div className="mt-4 space-y-2.5">
              {accessEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-line bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{event.action}</p>
                    <Badge tone={event.level === "Critical" ? "bad" : event.level === "Warning" ? "amber" : "info"}>
                      {event.level}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{event.actor} · {event.target}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">{event.ts}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Pending IAM approvals"
        subtitle="Demo team-access workflow preserving the original drawer styling"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-faint">11 items in queue</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Dismiss</Button>
              <Button onClick={() => setOpen(false)}>Approve batch</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {accessEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                <p className="font-display text-base font-bold text-ink">{event.action}</p>
                  <p className="text-sm text-ink-muted">{event.target}</p>
                </div>
                <Badge tone={event.level === "Critical" ? "bad" : "amber"}>{event.level}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Check sponsor exposure, user tenure, and pod scope before granting the requested access.
              </p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
