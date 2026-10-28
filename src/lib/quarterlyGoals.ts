import type { KnowledgeResource } from "@/lib/knowledgeSpace/types";

export const QUARTER_PLAYBOOK_WEEKS = 8;

export type QuarterlyGoalSectionId =
  | "talent"
  | "industry"
  | "marketing"
  | "distribution"
  | "campus-companies"
  | "community";

export interface QuarterlyGoalDef {
  id: string;
  title: string;
  description: string;
  helpsPod?: string;
  helpsStudents?: string;
  target: number;
  unit: string;
  cadence?: string;
  trackHint: string;
  href: string;
  knowledgeHref?: string;
}

export interface QuarterlySectionDef {
  id: QuarterlyGoalSectionId;
  title: string;
  summary: string;
  goals: QuarterlyGoalDef[];
}

export const QUARTERLY_TARGETS = {
  weeks: QUARTER_PLAYBOOK_WEEKS,
  studioSeats: 8,
  castleSeats: 8,
  placements: 5,
  industryPartners: 5,
  outreach: 50,
  researchPerWeek: 10,
  outreachPerWeek: 6,
  researchHive: 80,
  contentPerWeek: 4,
  publishedContent: 32,
  educationalContent: 16,
  partnershipContent: 8,
  promotionalContent: 8,
  academicPerMonth: 2,
  academicPartnerships: 4,
  brandEngagementSpecialists: 50,
  nanoInfluencers: 10,
  campusCompanies: 2,
  events: 3,
  eventEngagement: 100,
} as const;

export function currentQuarterMeta(now = new Date()) {
  const quarterIndex = Math.floor(now.getMonth() / 3);
  const labels = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"] as const;
  return {
    year: now.getFullYear(),
    quarter: quarterIndex + 1,
    label: `Q${quarterIndex + 1} ${now.getFullYear()}`,
    rangeLabel: labels[quarterIndex],
    playbookWeeks: QUARTER_PLAYBOOK_WEEKS,
  };
}

export const QUARTERLY_SECTIONS: QuarterlySectionDef[] = [
  {
    id: "talent",
    title: "Talent Development",
    summary: "Run one Experience Studio cohort, one CASTLE cohort, and place five students with industry clients.",
    goals: [
      {
        id: "experience-studio",
        title: "Run 1 Experience Studio cohort",
        description: "Each Experience Studio cohort needs a minimum of 8 people. Track it by applicants added to observership.",
        helpsPod: "Gives the pod a live first-year pipeline it can see, staff, and convert into later CASTLE and Fusion Work Study seats.",
        helpsStudents: "Helps first years explore roles, domains, and industries before they commit to a longer work track.",
        target: QUARTERLY_TARGETS.studioSeats,
        unit: "observership seats",
        cadence: "1 cohort this quarter · 8 people minimum",
        trackHint: "Applicants → Experience Studio",
        href: "/applicants/futurecraft",
        knowledgeHref: "/knowledge-space?q=Experience%20Studio",
      },
      {
        id: "castle",
        title: "Run 1 CASTLE cohort",
        description: "CASTLE can be Entrepreneurship, Tech, or Marketing. Each cohort needs a minimum of 8 people. Track it by applicants added to apprenticeship / CASTLE.",
        helpsPod: "Turns the pod into a delivery bench with students who can take real client and campus-company work.",
        helpsStudents: "Gives students their first work experience and moves them closer to employability.",
        target: QUARTERLY_TARGETS.castleSeats,
        unit: "CASTLE seats",
        cadence: "1 cohort this quarter · 8 people minimum",
        trackHint: "Applicants → CASTLE",
        href: "/applicants/castle",
        knowledgeHref: "/knowledge-space?q=CASTLE",
      },
      {
        id: "fws-placements",
        title: "Place 5 students with industry clients",
        description: "These are internships inside Fusion Work Study. Closing five placements is the employability proof of the quarter.",
        helpsPod: "Converts industry relationships into paid student work and makes the pod a credible placement partner.",
        helpsStudents: "Puts students into real industry internships instead of leaving talent development at the cohort stage.",
        target: QUARTERLY_TARGETS.placements,
        unit: "FWS internships",
        cadence: "5 placements this quarter",
        trackHint: "Applicants → FWS / Industry",
        href: "/applicants/industry",
        knowledgeHref: "/knowledge-space?q=Fusion%20Work%20Study",
      },
    ],
  },
  {
    id: "industry",
    title: "Industrial Partnerships",
    summary: "Close 5 industry partners this quarter by researching 80 companies and outreaching at least 50.",
    goals: [
      {
        id: "industry-partners",
        title: "Close 5 industrial partners",
        description: "Talent goals only land if the pod has clients. Five closed industry partners is the quarter’s partnership floor.",
        target: QUARTERLY_TARGETS.industryPartners,
        unit: "industry partners",
        cadence: "5 closed this quarter",
        trackHint: "Pod partners · industry",
        href: "/pods",
        knowledgeHref: "/knowledge-space?q=industrial%20partners",
      },
      {
        id: "outreach",
        title: "Outreach 50 companies",
        description: "Closing 5 partners takes a pipeline of about 50 outreaches. The weekly outreach floor is 6.",
        target: QUARTERLY_TARGETS.outreach,
        unit: "Rolodex outreaches",
        cadence: `${QUARTERLY_TARGETS.outreachPerWeek} outreaches / week`,
        trackHint: "Tracked in the Rolodex",
        href: "/pods",
        knowledgeHref: "/knowledge-space?q=Rolodex",
      },
      {
        id: "research-hive",
        title: "Build an 80-profile Research HIVE",
        description: "Research 10 companies a week so the remaining 8 weeks produce about 80 scored profiles the Rolodex can work from.",
        target: QUARTERLY_TARGETS.researchHive,
        unit: "HIVE profiles",
        cadence: `${QUARTERLY_TARGETS.researchPerWeek} researched / week`,
        trackHint: "Pod research throughput",
        href: "/pods",
        knowledgeHref: "/knowledge-space?q=Research%20HIVE",
      },
    ],
  },
  {
    id: "marketing",
    title: "Pod Marketing",
    summary: "Publish 4 pieces a week: 2 educational, 1 partnership, and 1 promotional — 32 pieces across 8 weeks.",
    goals: [
      {
        id: "published-content",
        title: "Publish 32 pieces this quarter",
        description: "Four published pieces a week is the marketing cadence. Treat this as a weekly goal that compounds across the remaining 8 weeks.",
        target: QUARTERLY_TARGETS.publishedContent,
        unit: "published pieces",
        cadence: `${QUARTERLY_TARGETS.contentPerWeek} / week`,
        trackHint: "Content Studio",
        href: "/content",
        knowledgeHref: "/knowledge-space?q=pod%20marketing",
      },
      {
        id: "educational-content",
        title: "16 educational pieces",
        description: "Half the weekly output should teach: 2 educational pieces every week.",
        target: QUARTERLY_TARGETS.educationalContent,
        unit: "educational pieces",
        cadence: "2 / week",
        trackHint: "Content Studio · educational",
        href: "/content",
      },
      {
        id: "partnership-content",
        title: "8 partnership pieces",
        description: "One piece a week should feature a partner, client, club, or campus company.",
        target: QUARTERLY_TARGETS.partnershipContent,
        unit: "partnership pieces",
        cadence: "1 / week",
        trackHint: "Content Studio · partnership",
        href: "/content",
      },
      {
        id: "promotional-content",
        title: "8 promotional pieces",
        description: "One piece a week should promote the pod’s programs, cohorts, and open seats.",
        target: QUARTERLY_TARGETS.promotionalContent,
        unit: "promotional pieces",
        cadence: "1 / week",
        trackHint: "Content Studio · promotional",
        href: "/content",
      },
    ],
  },
  {
    id: "distribution",
    title: "Promotional & distribution powerhouse",
    summary: "Close at least 2 academic partnerships a month and keep 50 brand engagement specialists plus 10 nano-influencers ready.",
    goals: [
      {
        id: "academic-partnerships",
        title: "2 academic partnerships a month",
        description: "Partner with clubs inside the college and outside colleges. Two closed academic partnerships a month is 4 across the remaining 8 weeks.",
        target: QUARTERLY_TARGETS.academicPartnerships,
        unit: "academic partners",
        cadence: `${QUARTERLY_TARGETS.academicPerMonth} / month`,
        trackHint: "Pod clubs / academic partners",
        href: "/pods",
        knowledgeHref: "/knowledge-space?q=academic%20partnerships",
      },
      {
        id: "brand-engagement-specialists",
        title: "50 brand engagement specialists",
        description: "A distribution pod needs a mapped community bench of about 50 brand engagement specialists it can activate.",
        target: QUARTERLY_TARGETS.brandEngagementSpecialists,
        unit: "mapped specialists",
        cadence: "50 on the talent map",
        trackHint: "Pod talent mapped",
        href: "/pods",
      },
      {
        id: "nano-influencers",
        title: "10 nano-influencers",
        description: "Keep around 10 nano-influencers ready so partner and promotional content can travel on campus.",
        target: QUARTERLY_TARGETS.nanoInfluencers,
        unit: "nano-influencers",
        cadence: "10 on the talent map",
        trackHint: "Applicants · nano-influencer",
        href: "/applicants/industry",
      },
    ],
  },
  {
    id: "campus-companies",
    title: "Campus companies",
    summary: "Help students incubate ideas with the pod, staff them with talent, and feature them in TISA Uprise.",
    goals: [
      {
        id: "campus-company-partnerships",
        title: "Develop 2 campus company partnerships",
        description: "Encourage students to incubate with the pod, match them with the talent they need, and feature those startups in TISA Uprise.",
        target: QUARTERLY_TARGETS.campusCompanies,
        unit: "campus companies",
        cadence: "2 partnerships this quarter",
        trackHint: "Campus company partnerships",
        href: "/pods",
        knowledgeHref: "/knowledge-space?q=campus%20companies",
      },
    ],
  },
  {
    id: "community",
    title: "Community engagement",
    summary: "Run 2–3 events this quarter and bring 80–100 students into the pod’s orbit.",
    goals: [
      {
        id: "events",
        title: "Conduct 2–3 events",
        description: "Events are how the pod shows up on campus. Aim for 3 well-run sessions this quarter.",
        target: QUARTERLY_TARGETS.events,
        unit: "events",
        cadence: "2–3 / quarter",
        trackHint: "Event Management",
        href: "/events",
        knowledgeHref: "/knowledge-space?q=community%20events",
      },
      {
        id: "event-engagement",
        title: "Engage 80–100 students",
        description: "Those events should reach about 80–100 students overall — not just the core roster.",
        target: QUARTERLY_TARGETS.eventEngagement,
        unit: "students engaged",
        cadence: "80–100 across the quarter",
        trackHint: "Event attendance",
        href: "/events",
      },
    ],
  },
];

export const QUARTERLY_GOALS = QUARTERLY_SECTIONS.flatMap((section) => section.goals);

export function scoreProgress(current: number, target: number) {
  const safeTarget = Math.max(1, target);
  const percent = Math.min(100, Math.round((Math.max(0, current) / safeTarget) * 100));
  return { current: Math.max(0, current), target, percent, complete: current >= target };
}

export function averagePercent(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export type QuarterlyCounts = {
  observership: number;
  castle: number;
  placements: number;
  industryPartners: number;
  outreach: number;
  research: number;
  publishedContent: number;
  educationalContent: number;
  partnershipContent: number;
  promotionalContent: number;
  academicPartners: number;
  brandEngagementSpecialists: number;
  nanoInfluencers: number;
  campusCompanies: number;
  events: number;
  eventEngagement: number;
};

const COUNT_BY_GOAL: Record<string, keyof QuarterlyCounts> = {
  "experience-studio": "observership",
  castle: "castle",
  "fws-placements": "placements",
  "industry-partners": "industryPartners",
  outreach: "outreach",
  "research-hive": "research",
  "published-content": "publishedContent",
  "educational-content": "educationalContent",
  "partnership-content": "partnershipContent",
  "promotional-content": "promotionalContent",
  "academic-partnerships": "academicPartners",
  "brand-engagement-specialists": "brandEngagementSpecialists",
  "nano-influencers": "nanoInfluencers",
  "campus-company-partnerships": "campusCompanies",
  events: "events",
  "event-engagement": "eventEngagement",
};

export function buildQuarterlySnapshot(counts: QuarterlyCounts) {
  const byGoal: Record<string, ReturnType<typeof scoreProgress> & { id: string }> = {};
  const sections = QUARTERLY_SECTIONS.map((section) => {
    const goals = section.goals.map((goal) => {
      const progress = { id: goal.id, ...scoreProgress(counts[COUNT_BY_GOAL[goal.id]] ?? 0, goal.target) };
      byGoal[goal.id] = progress;
      return progress;
    });
    return {
      id: section.id,
      percent: averagePercent(goals.map((goal) => goal.percent)),
      complete: goals.filter((goal) => goal.complete).length,
      total: goals.length,
      goals,
    };
  });
  const allGoals = Object.values(byGoal);
  return {
    percent: averagePercent(allGoals.map((goal) => goal.percent)),
    complete: allGoals.filter((goal) => goal.complete).length,
    total: allGoals.length,
    counts,
    byGoal,
    sections,
  };
}

export function quarterlyGoalKnowledgeResources(): KnowledgeResource[] {
  return [
    {
      id: "qg-playbook",
      title: "Quarterly Goals playbook",
      description: "Recommended quarter for every pod: talent cohorts, 5 industry partners, weekly marketing, academic distribution, campus companies, and community events.",
      url: "/quarterly-goals",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Business Strategy",
      tags: ["quarterly-goals", "playbook"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-experience-studio",
      title: "Experience Studio",
      description: "A first-year observership cohort of at least 8 people. Track seats in Applicants → Experience Studio.",
      url: "/quarterly-goals#experience-studio",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Talent Development",
      tags: ["experience-studio", "observership", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-castle",
      title: "CASTLE",
      description: "An apprenticeship cohort of at least 8 people. Entrepreneurship, Tech, or Marketing CASTLE. Track in Applicants → CASTLE.",
      url: "/quarterly-goals#castle",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Talent Development",
      tags: ["castle", "apprenticeship", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-fws",
      title: "Fusion Work Study internships",
      description: "Place 5 students with industry clients this quarter. Track industry applicants.",
      url: "/quarterly-goals#fws-placements",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Talent Development",
      tags: ["fusion-work-study", "internship", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-industry",
      title: "Closing industrial partners",
      description: `Close ${QUARTERLY_TARGETS.industryPartners} industry partners via ${QUARTERLY_TARGETS.researchHive} HIVE profiles (${QUARTERLY_TARGETS.researchPerWeek}/week) and ${QUARTERLY_TARGETS.outreach} Rolodex outreaches (${QUARTERLY_TARGETS.outreachPerWeek}/week).`,
      url: "/quarterly-goals#industry-partners",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Founder Outreach",
      tags: ["industry", "rolodex", "hive", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-marketing",
      title: "Weekly pod marketing mix",
      description: `Publish ${QUARTERLY_TARGETS.contentPerWeek} pieces a week: 2 educational, 1 partnership, 1 promotional (${QUARTERLY_TARGETS.publishedContent} in ${QUARTERLY_TARGETS.weeks} weeks).`,
      url: "/quarterly-goals#published-content",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Marketing",
      tags: ["marketing", "content", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-distribution",
      title: "Academic partnerships and distribution talent",
      description: `${QUARTERLY_TARGETS.academicPerMonth} academic partnerships a month, ${QUARTERLY_TARGETS.brandEngagementSpecialists} brand engagement specialists, ${QUARTERLY_TARGETS.nanoInfluencers} nano-influencers.`,
      url: "/quarterly-goals#academic-partnerships",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Business Development",
      tags: ["academic", "distribution", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-campus-companies",
      title: "Campus companies and TISA Uprise",
      description: "Measure campus-company development by partnerships. Help students incubate with the pod and feature startups in TISA Uprise.",
      url: "/quarterly-goals#campus-company-partnerships",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Startup Research",
      tags: ["campus-company", "tisa-uprise", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
    {
      id: "qg-events",
      title: "Community events",
      description: "Run 2–3 events this quarter with overall engagement of 80–100 students.",
      url: "/quarterly-goals#events",
      type: "in-app" as const,
      category: "caarya-curated" as const,
      domain: "Business Development",
      tags: ["events", "community", "quarterly-goals"],
      curatedByName: "Caarya",
      source: "seed" as const,
      canEdit: false,
      canDelete: false,
    },
  ];
}

export function emptyQuarterlyCounts(): QuarterlyCounts {
  return {
    observership: 0,
    castle: 0,
    placements: 0,
    industryPartners: 0,
    outreach: 0,
    research: 0,
    publishedContent: 0,
    educationalContent: 0,
    partnershipContent: 0,
    promotionalContent: 0,
    academicPartners: 0,
    brandEngagementSpecialists: 0,
    nanoInfluencers: 0,
    campusCompanies: 0,
    events: 0,
    eventEngagement: 0,
  };
}

export function quarterlyPlaybookForMoksha() {
  return [
    "Quarterly Goals playbook (any pod): 1 Experience Studio cohort (8 observership), 1 CASTLE cohort (8 apprenticeship; Entrepreneurship/Tech/Marketing), 5 Fusion Work Study placements.",
    "Industry: close 5 partners via 80 HIVE profiles (10/week) and 50 Rolodex outreaches (6/week).",
    "Marketing: 4 published pieces/week = 2 educational, 1 partnership, 1 promotional (32 in 8 weeks).",
    "Distribution: 2 academic partnerships/month, 50 brand engagement specialists, 10 nano-influencers.",
    "Campus companies: incubate student startups with the pod and feature them in TISA Uprise (2 partnerships).",
    "Community: 2–3 events reaching 80–100 students.",
  ].join(" ");
}
