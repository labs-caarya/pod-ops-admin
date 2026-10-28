import {
  getAdminDashboard,
  listChallenges,
  listNetworkPartners,
  type AdminDashboardData,
  type NetworkPartner,
  type PodInsight,
  type PodPeriodMetrics,
} from "@/lib/api";
import type { Challenge } from "@/lib/types";
import { quarterlyPlaybookForMoksha } from "@/lib/quarterlyGoals";

export type AdminBiSnapshot = {
  dashboard: AdminDashboardData;
  partners: NetworkPartner[];
  challenges: Challenge[];
  fetchedAt: string;
};

let cached: { at: number; data: AdminBiSnapshot } | null = null;
const CACHE_MS = 2 * 60 * 1000;

export async function getAdminBiSnapshot(): Promise<AdminBiSnapshot | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  try {
    const [dashboard, partners, challenges] = await Promise.all([
      getAdminDashboard(),
      listNetworkPartners(),
      listChallenges(),
    ]);
    const data: AdminBiSnapshot = {
      dashboard,
      partners,
      challenges,
      fetchedAt: new Date().toISOString(),
    };
    cached = { at: Date.now(), data };
    return data;
  } catch {
    return null;
  }
}

function sumMetrics(insights: PodInsight[], period: "daily" | "weekly"): PodPeriodMetrics {
  const zero: PodPeriodMetrics = {
    researchCreated: 0,
    researchScored: 0,
    outreachActivities: 0,
    meetings: 0,
    opportunitiesCreated: 0,
    opportunitiesShared: 0,
    offersSent: 0,
    offersAccepted: 0,
    placements: 0,
    challengesOpened: 0,
    challengesResolved: 0,
    goalsCompleted: 0,
  };
  return insights.reduce((acc, row) => {
    const m = row[period];
    for (const key of Object.keys(zero) as (keyof PodPeriodMetrics)[]) {
      acc[key] += m[key] ?? 0;
    }
    return acc;
  }, { ...zero });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n: number) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function partnersSince(partners: NetworkPartner[], since: Date) {
  return partners.filter((p) => {
    const created = p.createdAt ? new Date(p.createdAt) : null;
    return created && created >= since;
  });
}

function openChallenges(challenges: Challenge[]) {
  return challenges.filter((c) => c.status !== "Resolved");
}

export function buildBiContextBlock(snapshot: AdminBiSnapshot): string {
  const { dashboard, partners, challenges } = snapshot;
  const insights = dashboard.insights ?? [];
  const daily = sumMetrics(insights, "daily");
  const weekly = sumMetrics(insights, "weekly");
  const open = openChallenges(challenges);
  const noResearchToday = insights.filter(
    (i) => i.daily.researchCreated === 0 && i.daily.researchScored === 0,
  );
  const newPartnersWeek = partnersSince(partners, daysAgo(7));

  return JSON.stringify(
    {
      fetchedAt: snapshot.fetchedAt,
      network: {
        activePods: dashboard.metrics.activePods,
        podsUnderWatch: dashboard.attention.podsUnderWatch,
        criticalChallenges: dashboard.attention.criticalChallenges,
        openChallenges: dashboard.metrics.openChallenges,
        applicants: dashboard.metrics.applicants,
      },
      health: {
        thriving: dashboard.pods.filter((p) => p.health === "Thriving").length,
        watching: dashboard.pods.filter((p) => p.health === "Watching").length,
        atRisk: dashboard.pods.filter((p) => p.health === "At Risk").length,
      },
      todayAggregate: daily,
      weekAggregate: weekly,
      podsWithoutResearchToday: noResearchToday.map((i) => i.podName),
      newPartnersLast7Days: newPartnersWeek.map((p) => ({
        name: p.name,
        pod: p.podName,
        category: p.category,
        createdAt: p.createdAt,
      })),
      topOpenChallenges: open.slice(0, 12).map((c) => ({
        title: c.title,
        severity: c.severity,
        status: c.status,
        pod: c.collegeName ?? c.collegeId,
        owner: c.owner,
      })),
      priorities: dashboard.priorities?.slice(0, 8),
      leaderTasks: dashboard.leaderTasks?.slice(0, 8),
      quarterlyGoalsPlaybook: quarterlyPlaybookForMoksha(),
    },
    null,
    0,
  );
}

export function answerAdminBiQuestion(question: string, snapshot: AdminBiSnapshot): string | null {
  const text = question.toLowerCase();
  const { dashboard, partners, challenges } = snapshot;
  const insights = dashboard.insights ?? [];

  const wantsInsights = /insight|summary|overview|pulse|status/.test(text);
  const wantsWeek = /this week|past week|week so far|happened this week/.test(text);
  const wantsToday = /today|happened today|so far today/.test(text);
  const wantsChallenges = /challenge|facing|blocker|critical|vault/.test(text);
  const wantsPartners = /partner|club|industry|spa|sponsor/.test(text);
  const wantsResearch = /research|hive|submitted|submission/.test(text);
  const wantsNext = /what should|do next|priorit|recommend|focus|action/.test(text);
  const wantsQuarterly = /quarterly goal|financial stability|experience studio|castle|fusion work|fws/.test(text);

  if (wantsQuarterly) {
    return [
      "Quarterly Goals playbook — what any pod should achieve this quarter.",
      quarterlyPlaybookForMoksha(),
      "Open Operations → Quarterly Goals for the full playbook, or a pod’s Summary tab for that pod’s live progress.",
    ].join("\n\n");
  }

  if (wantsResearch && /today|submit|submission|how many|haven't|have not|missing|logged/.test(text)) {
    return formatResearchToday(insights);
  }
  if (wantsWeek) return formatWeek(insights, dashboard);
  if (wantsToday) return formatToday(insights, dashboard);
  if (wantsChallenges) return formatChallenges(challenges, dashboard);
  if (wantsPartners && /new|recent|did we get|any|partner/.test(text)) return formatNewPartners(partners);
  if (wantsResearch) return formatResearchToday(insights);
  if (wantsNext) return formatNextActions(dashboard);
  if (wantsInsights) return formatInsights(dashboard, insights);

  return null;
}

function formatInsights(dashboard: AdminDashboardData, insights: PodInsight[]): string {
  const atRisk = dashboard.pods.filter((p) => p.health === "At Risk");
  const watching = dashboard.pods.filter((p) => p.health === "Watching");
  const daily = sumMetrics(insights, "daily");
  const weekly = sumMetrics(insights, "weekly");

  const lines = [
    "Network pulse",
    `• ${dashboard.metrics.activePods} active pods · ${dashboard.metrics.openChallenges} open challenges (${dashboard.attention.criticalChallenges} critical)`,
    `• Health: ${dashboard.pods.filter((p) => p.health === "Thriving").length} thriving · ${watching.length} watching · ${atRisk.length} at risk`,
    `• ${dashboard.metrics.applicants} applicants in pipeline · ${dashboard.attention.podsUnderWatch} pods flagged for watch`,
    "",
    "Today (all pods)",
    `• Research: ${daily.researchCreated} created · ${daily.researchScored} scored`,
    `• Outreach: ${daily.outreachActivities} activities · ${daily.meetings} meetings`,
    `• Placements: ${daily.offersSent} offers sent · ${daily.placements} placements`,
    "",
    "This week (all pods)",
    `• Research: ${weekly.researchCreated} created · ${weekly.researchScored} scored`,
    `• Challenges: ${weekly.challengesOpened} opened · ${weekly.challengesResolved} resolved`,
  ];

  if (atRisk.length) {
    lines.push("", "Pods at risk", ...atRisk.slice(0, 5).map((p) => `• ${p.name} (${p.activationPercent}% activation)`));
  }

  if (dashboard.priorities?.length) {
    lines.push(
      "",
      "Top priorities",
      ...dashboard.priorities.slice(0, 4).map((p) => `• [${p.severity}] ${p.title} — ${p.owner}`),
    );
  }

  return lines.join("\n");
}

function formatToday(insights: PodInsight[], dashboard: AdminDashboardData): string {
  const daily = sumMetrics(insights, "daily");
  const movers = [...insights]
    .filter((i) => i.daily.researchCreated + i.daily.outreachActivities + i.daily.meetings > 0)
    .sort(
      (a, b) =>
        b.daily.researchCreated +
        b.daily.outreachActivities -
        (a.daily.researchCreated + a.daily.outreachActivities),
    )
    .slice(0, 6);

  const quiet = insights.filter((i) => i.daily.researchCreated === 0 && i.daily.researchScored === 0);

  return [
    "Today across the network",
    `• Research: ${daily.researchCreated} profiles created · ${daily.researchScored} scored`,
    `• Outreach: ${daily.outreachActivities} touchpoints · ${daily.meetings} meetings booked/held`,
    `• Ops: ${daily.opportunitiesCreated} opportunities created · ${daily.challengesOpened} challenges opened · ${daily.challengesResolved} resolved`,
    `• Talent: ${daily.offersSent} offers sent · ${daily.placements} placements`,
    "",
    dashboard.leaderTasks?.length
      ? `• ${dashboard.leaderTasks.length} active leader tasks on the board`
      : "• No leader tasks queued in the dashboard feed",
    "",
    movers.length ? "Most active pods today" : "Activity",
    ...(movers.length
      ? movers.map(
          (i) =>
            `• ${i.podName}: ${i.daily.researchCreated} research · ${i.daily.outreachActivities} outreach · ${i.daily.meetings} meetings`,
        )
      : ["• Light activity so far — nudge pods that haven't logged research or outreach."]),
    "",
    quiet.length
      ? `${quiet.length} pod(s) with no research logged today: ${quiet
          .slice(0, 8)
          .map((i) => i.podName)
          .join(", ")}${quiet.length > 8 ? "…" : ""}`
      : "All pods have logged at least some research activity today.",
  ].join("\n");
}

function formatWeek(insights: PodInsight[], dashboard: AdminDashboardData): string {
  const weekly = sumMetrics(insights, "weekly");
  const prev = insights.reduce(
    (acc, row) => {
      acc.researchCreated += row.previousWeek.researchCreated;
      acc.outreachActivities += row.previousWeek.outreachActivities;
      acc.placements += row.previousWeek.placements;
      return acc;
    },
    { researchCreated: 0, outreachActivities: 0, placements: 0 },
  );

  const delta = (current: number, previous: number) => {
    if (previous === 0) return current ? "↑ new activity" : "flat";
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct >= 0 ? `↑ ${pct}% vs prior week` : `↓ ${Math.abs(pct)}% vs prior week`;
  };

  return [
    "This week across pods",
    `• Research: ${weekly.researchCreated} created · ${weekly.researchScored} scored (${delta(weekly.researchCreated, prev.researchCreated)})`,
    `• Outreach: ${weekly.outreachActivities} activities · ${weekly.meetings} meetings (${delta(weekly.outreachActivities, prev.outreachActivities)})`,
    `• Placements: ${weekly.placements} placements (${delta(weekly.placements, prev.placements)})`,
    `• Challenges: ${weekly.challengesOpened} opened · ${weekly.challengesResolved} resolved · ${weekly.goalsCompleted} goals completed`,
    "",
    `Attention: ${dashboard.attention.podsUnderWatch} pods under watch · ${dashboard.attention.criticalChallenges} critical challenge(s)`,
    dashboard.throughput?.length
      ? `\nApplicant throughput (latest week): ${dashboard.throughput[dashboard.throughput.length - 1]?.week ?? "—"}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatChallenges(challenges: Challenge[], dashboard: AdminDashboardData): string {
  const open = openChallenges(challenges);
  const bySeverity = {
    Critical: open.filter((c) => c.severity === "Critical"),
    High: open.filter((c) => c.severity === "High"),
    Medium: open.filter((c) => c.severity === "Medium"),
    Low: open.filter((c) => c.severity === "Low"),
  };

  const lines = [
    `Open challenges: ${open.length} network-wide (${dashboard.attention.criticalChallenges} marked critical on dashboard)`,
    "",
    "By severity",
    `• Critical: ${bySeverity.Critical.length}`,
    `• High: ${bySeverity.High.length}`,
    `• Medium: ${bySeverity.Medium.length}`,
    `• Low: ${bySeverity.Low.length}`,
  ];

  const highlight = [...bySeverity.Critical, ...bySeverity.High].slice(0, 6);
  if (highlight.length) {
    lines.push("", "Pods facing the highest-severity items");
    for (const c of highlight) {
      lines.push(`• [${c.severity}] ${c.title} — ${c.collegeName ?? "Network"} (${c.status})`);
    }
  } else if (open.length) {
    lines.push("", "Recent open items");
    for (const c of open.slice(0, 6)) {
      lines.push(`• [${c.severity}] ${c.title} — ${c.collegeName ?? "Network"}`);
    }
  } else {
    lines.push("", "No open challenges in the vault right now.");
  }

  return lines.join("\n");
}

function formatNewPartners(partners: NetworkPartner[]): string {
  const today = partnersSince(partners, startOfDay(new Date()));
  const week = partnersSince(partners, daysAgo(7));

  const lines = [
    "Partner intake",
    `• Today: ${today.length} new partner record(s)`,
    `• Last 7 days: ${week.length} new partner record(s)`,
  ];

  if (week.length) {
    lines.push("", "New this week");
    for (const p of week.slice(0, 10)) {
      lines.push(`• ${p.name} (${p.category}) — ${p.podName}${p.createdAt ? ` · ${p.createdAt.slice(0, 10)}` : ""}`);
    }
    if (week.length > 10) lines.push(`• …and ${week.length - 10} more`);
  } else {
    lines.push("", "No new partners logged in the last 7 days. Check Rolodex wins on quiet pods.");
  }

  return lines.join("\n");
}

function formatResearchToday(insights: PodInsight[]): string {
  const missing = insights.filter((i) => i.daily.researchCreated === 0 && i.daily.researchScored === 0);
  const partial = insights.filter(
    (i) => i.daily.researchCreated === 0 && i.daily.researchScored > 0,
  );
  const active = insights.filter((i) => i.daily.researchCreated > 0);

  return [
    "Research submissions today",
    `• ${missing.length} pod(s) with no research created or scored today`,
    `• ${partial.length} pod(s) scored existing work but created 0 new profiles`,
    `• ${active.length} pod(s) created at least one new research profile`,
    "",
    missing.length
      ? `Haven't submitted research today: ${missing.map((i) => i.podName).join(", ")}`
      : "Every pod has logged research activity today.",
  ].join("\n");
}

function formatNextActions(dashboard: AdminDashboardData): string {
  const lines = ["Suggested focus for you next"];

  if (dashboard.attention.criticalChallenges > 0) {
    lines.push(`• Triage ${dashboard.attention.criticalChallenges} critical challenge(s) in Challenge Vault.`);
  }
  if (dashboard.attention.podsUnderWatch > 0) {
    lines.push(`• Review ${dashboard.attention.podsUnderWatch} pod(s) under watch — check activation and open comments.`);
  }

  const atRisk = dashboard.pods.filter((p) => p.health === "At Risk");
  if (atRisk.length) {
    lines.push(`• Call or async-check at-risk pods: ${atRisk.slice(0, 4).map((p) => p.name).join(", ")}${atRisk.length > 4 ? "…" : ""}.`);
  }

  if (dashboard.priorities?.length) {
    lines.push("", "From the priority queue");
    for (const p of dashboard.priorities.slice(0, 4)) {
      lines.push(`• ${p.title} (${p.severity}) — owner: ${p.owner}`);
    }
  }

  if (dashboard.leaderTasks?.length) {
    lines.push("", "Leader tasks due attention");
    for (const t of dashboard.leaderTasks.slice(0, 4)) {
      lines.push(`• ${t.collegeName}: ${t.title}${t.dueDate ? ` (due ${t.dueDate.slice(0, 10)})` : ""}`);
    }
  }

  if (lines.length === 1) {
    lines.push("• Network looks steady — skim dashboard Partnerships and Marketing tabs for calendar gaps.");
  }

  return lines.join("\n");
}

export const OFFLINE_BI_FALLBACK =
  "I couldn't load live admin data (check you're signed in and the API is reachable). Try again in a moment, or open Dashboard / Challenge Vault for the same metrics.";
