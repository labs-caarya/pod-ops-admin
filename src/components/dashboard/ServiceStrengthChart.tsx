import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getServiceStrength, POD_SERVICE_GROUPS } from "@/lib/data/services";
import type { PodServiceId, TalentMember } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  "Talent Placement": "#38bdf8",
  "Innovation Consulting": "#fbbf24",
  "Brand Engagement": "#fb3a63",
  "Brand Promotion": "#a78bfa",
};

/** Short X-axis labels so the vertical bars read cleanly. */
const CHART_LABELS: Record<PodServiceId, string> = {
  talent_placement: "Talent",
  innovation_consulting: "Innovation",
  event_orchestration: "Events",
  testing_360: "360° Test",
  focus_groups: "Focus Groups",
  market_research: "Research",
  nano_influencer_marketing: "Nano-inf",
};

const tooltipStyle = {
  background: "#1a1113",
  border: "1px solid #36262b",
  borderRadius: 12,
  color: "#f6ece9",
};

export function ServiceStrengthChart({
  talent,
  title = "Service strength",
  subtitle = "Mapped students opted in per service — taller bars = stronger delivery capacity.",
  hideLink = false,
}: {
  talent: TalentMember[];
  title?: string;
  subtitle?: string;
  hideLink?: boolean;
}) {
  const data = getServiceStrength(talent).map((row) => ({
    ...row,
    chartLabel: CHART_LABELS[row.id],
    fill: CATEGORY_COLORS[row.category] ?? "#fb3a63",
  }));

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="lg:col-span-2 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
        </div>
        {!hideLink && (
          <Link to="/talent" className="flex items-center gap-1 text-sm text-ruby-bright hover:underline">
            Manage talent <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {POD_SERVICE_GROUPS.map((g) => (
          <span key={g.id} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: CATEGORY_COLORS[g.label] }}
            />
            {g.label}
          </span>
        ))}
      </div>

      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
            barCategoryGap="18%"
          >
            <CartesianGrid stroke="#36262b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="chartLabel"
              tick={{ fill: "#b9a6a4", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.max(maxCount + 1, 4)]}
              tick={{ fill: "#7c6a6c", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Students",
                angle: -90,
                position: "insideLeft",
                fill: "#7c6a6c",
                fontSize: 10,
                offset: 12,
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(225,29,72,0.1)" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value} student${value === 1 ? "" : "s"}`, "Opted in"]}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as (typeof data)[0] | undefined;
                return row ? `${row.label} · ${row.category}` : "";
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.fill} fillOpacity={0.92} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        {talent.length} students mapped · students can opt into multiple services
      </p>
    </Card>
  );
}
