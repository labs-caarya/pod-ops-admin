export type PodHealth = "Thriving" | "Watching" | "At Risk";
export type EscalationLevel = "Info" | "Warning" | "Critical";

export interface AdminPod {
  id: string;
  name: string;
  city: string;
  lead: string;
  college: string;
  members: number;
  activeClubs: number;
  health: PodHealth;
  maturityScore: number;
  outreachCoverage: number;
  placements: number;
  openRisks: number;
  pendingApprovals: number;
}

export interface PodMember {
  name: string;
  role: string;
  focus: string;
}

export interface PodClub {
  name: string;
  stage: string;
  contribution: string;
}

export interface PodResearchItem {
  company: string;
  type: string;
  status: string;
  angle: string;
}

export interface AdminPodDetail {
  members: PodMember[];
  clubs: PodClub[];
  research: PodResearchItem[];
}

export interface AccessRole {
  id: string;
  role: string;
  users: number;
  scope: string;
  criticalScopes: string[];
}

export interface AccessEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  level: EscalationLevel;
  ts: string;
}

export interface PriorityItem {
  id: string;
  owner: string;
  action: string;
  target: string;
  level: EscalationLevel;
  ts: string;
}

export interface CommandMetric {
  label: string;
  value: string;
  tone: "ruby" | "amber" | "good" | "info";
  hint: string;
}

export interface PipelineStageMetric {
  id: string;
  label: string;
  count: string;
  hint: string;
}

export const ADMIN_WORKSPACE = {
  name: "Pod Ops Admin",
  network: "All India Pod Network",
  tagline: "A working view of partner momentum, pod readiness, team access, and delivery blockers.",
};

export const commandMetrics: CommandMetric[] = [
  { label: "Active pods", value: "18", tone: "ruby", hint: "14 healthy, 3 watching, 1 needs intervention" },
  { label: "Follow-ups due", value: "27", tone: "amber", hint: "Across sponsors, clubs, and active partner threads" },
  { label: "Critical blockers", value: "4", tone: "good", hint: "2 sponsor, 1 ops, 1 talent" },
  { label: "Nexus clients", value: "6", tone: "info", hint: "Active client-side threads that need execution visibility" },
];

export const adminPods: AdminPod[] = [
  {
    id: "pod_gitam",
    name: "GITAM Pod",
    city: "Visakhapatnam",
    lead: "Harsha Vardhan",
    college: "GITAM Vishakhapatnam",
    members: 16,
    activeClubs: 3,
    health: "Thriving",
    maturityScore: 83,
    outreachCoverage: 71,
    placements: 9,
    openRisks: 1,
    pendingApprovals: 1,
  },
  {
    id: "pod_delhi",
    name: "Nexus Pod",
    city: "Delhi",
    lead: "Riya Sharma",
    college: "SRCC",
    members: 24,
    activeClubs: 5,
    health: "Thriving",
    maturityScore: 91,
    outreachCoverage: 82,
    placements: 18,
    openRisks: 1,
    pendingApprovals: 2,
  },
  {
    id: "pod_bengaluru",
    name: "Atlas Pod",
    city: "Bengaluru",
    lead: "Arjun Menon",
    college: "Christ University",
    members: 17,
    activeClubs: 4,
    health: "Watching",
    maturityScore: 74,
    outreachCoverage: 58,
    placements: 10,
    openRisks: 3,
    pendingApprovals: 4,
  },
  {
    id: "pod_mumbai",
    name: "Signal Pod",
    city: "Mumbai",
    lead: "Kiara Shah",
    college: "NMIMS",
    members: 19,
    activeClubs: 6,
    health: "Thriving",
    maturityScore: 86,
    outreachCoverage: 77,
    placements: 14,
    openRisks: 2,
    pendingApprovals: 1,
  },
  {
    id: "pod_pune",
    name: "Forge Pod",
    city: "Pune",
    lead: "Kabir Jadhav",
    college: "Symbiosis",
    members: 13,
    activeClubs: 3,
    health: "At Risk",
    maturityScore: 49,
    outreachCoverage: 35,
    placements: 5,
    openRisks: 6,
    pendingApprovals: 4,
  },
  {
    id: "pod_hyderabad",
    name: "Orbit Pod",
    city: "Hyderabad",
    lead: "Megha Reddy",
    college: "ISB YLP",
    members: 15,
    activeClubs: 4,
    health: "Watching",
    maturityScore: 68,
    outreachCoverage: 51,
    placements: 8,
    openRisks: 2,
    pendingApprovals: 0,
  },
];

export const accessRoles: AccessRole[] = [
  {
    id: "super_admin",
    role: "Core Admin",
    users: 2,
    scope: "All pods and system settings",
    criticalScopes: ["role access", "pod settings", "audit history", "partner value visibility"],
  },
  {
    id: "org_admin",
    role: "Ops Lead",
    users: 6,
    scope: "Cross-pod operations and interventions",
    criticalScopes: ["research updates", "placement approvals", "partner updates", "access approvals"],
  },
  {
    id: "pod_lead",
    role: "Pod Lead",
    users: 18,
    scope: "Single pod management",
    criticalScopes: ["contact updates", "talent updates", "job updates", "challenge updates"],
  },
  {
    id: "partner_viewer",
    role: "Partner Viewer",
    users: 9,
    scope: "Partner-scoped read access",
    criticalScopes: ["partner dashboard", "partner talent view"],
  },
];

export const podDetails: Record<string, AdminPodDetail> = {
  pod_gitam: {
    members: [
      { name: "Harsha Vardhan", role: "Pod Lead", focus: "Campus ownership and client handoffs" },
      { name: "Lasya Priya", role: "Talent Ops", focus: "Student mapping and staffing" },
      { name: "Dheeraj Kumar", role: "Outreach", focus: "Company follow-ups and rolodex movement" },
      { name: "Keerthana Rao", role: "Research", focus: "Local company and partner profiling" },
      { name: "Sai Teja", role: "Partner Manager", focus: "Club coordination and partner maintenance" },
    ],
    clubs: [
      { name: "GUSAC", stage: "Active", contribution: "Student founder and startup pipeline" },
      { name: "G-Studio", stage: "Engaged", contribution: "Creator and design support" },
      { name: "IEEE GITAM SB", stage: "Prospect", contribution: "Technical student talent and workshops" },
    ],
    research: [
      { company: "Efftronics", type: "Industry Partner", status: "Research", angle: "Engineering interns and product storytelling" },
      { company: "Apollo Health City Vizag", type: "Industry Partner", status: "Scored", angle: "Health surveys and student outreach" },
      { company: "NAD Startup Circle", type: "Academic Partner", status: "In Conversation", angle: "Founder discovery and club access" },
    ],
  },
  pod_delhi: {
    members: [
      { name: "Riya Sharma", role: "Pod Lead", focus: "Sponsors and partnerships" },
      { name: "Karan Verma", role: "Research Lead", focus: "HIVE profiling and outreach handoff" },
      { name: "Aisha Khan", role: "Creator Ops", focus: "UGC and promoter talent" },
      { name: "Mohit Rao", role: "Data Support", focus: "Surveys and reporting" },
    ],
    clubs: [
      { name: "SRCC Business Conclave", stage: "Strategic", contribution: "Sponsor inventory and flagship event access" },
      { name: "Marketing Society", stage: "Active", contribution: "Creator and design talent pipeline" },
      { name: "Entrepreneurship Cell", stage: "Engaged", contribution: "Founder warm intros" },
    ],
    research: [
      { company: "Suta", type: "Brand", status: "Scored", angle: "Campus creator engine" },
      { company: "Zomato District", type: "Industry Partner", status: "Outreach Sent", angle: "Event crew and promoter network" },
      { company: "Wakefit", type: "Brand", status: "Research", angle: "Student sleep research panels" },
    ],
  },
  pod_bengaluru: {
    members: [
      { name: "Arjun Menon", role: "Pod Lead", focus: "Partner growth" },
      { name: "Neha S", role: "Talent Ops", focus: "Student mapping and placements" },
      { name: "Roshni Pai", role: "Researcher", focus: "Startup and incubator discovery" },
    ],
    clubs: [
      { name: "Startup Forum", stage: "Active", contribution: "Founder pipeline" },
      { name: "Media Cell", stage: "Prospect", contribution: "Campus visibility" },
      { name: "Consulting Club", stage: "Engaged", contribution: "Research and case talent" },
    ],
    research: [
      { company: "Headstart Network", type: "Community", status: "In Conversation", angle: "Pipeline-sharing partnership" },
      { company: "Sleepy Owl", type: "Brand", status: "Scored", angle: "Sampling and student creators" },
    ],
  },
  pod_mumbai: {
    members: [
      { name: "Kiara Shah", role: "Pod Lead", focus: "Brand growth and club ops" },
      { name: "Yash Patil", role: "Outreach", focus: "Founder and partner meetings" },
      { name: "Pooja Jain", role: "Content", focus: "UGC and club promotion" },
    ],
    clubs: [
      { name: "Brandwagon", stage: "Strategic", contribution: "Marketing talent pool" },
      { name: "E-Cell", stage: "Active", contribution: "Campus startup pipeline" },
      { name: "Cultural Committee", stage: "Engaged", contribution: "Event execution reach" },
    ],
    research: [
      { company: "Suta", type: "Brand", status: "In Conversation", angle: "Mumbai creator pods" },
      { company: "Boat Lifestyle", type: "Brand", status: "Research", angle: "Student ambassador squads" },
    ],
  },
  pod_pune: {
    members: [
      { name: "Kabir Jadhav", role: "Pod Lead", focus: "Recovery and sponsor closure" },
      { name: "Tina Kale", role: "Research", focus: "Club and startup mapping" },
    ],
    clubs: [
      { name: "Symbiosis E-Cell", stage: "Watching", contribution: "Needs ownership reset" },
      { name: "Business Society", stage: "Active", contribution: "Speaker and sponsor access" },
    ],
    research: [
      { company: "Forge Campus Collective", type: "Campus Group", status: "Blocked", angle: "Sponsor package rescue" },
      { company: "The Whole Truth", type: "Brand", status: "Scored", angle: "Sampling and student reviews" },
    ],
  },
  pod_hyderabad: {
    members: [
      { name: "Megha Reddy", role: "Pod Lead", focus: "Partner management" },
      { name: "Harsh V", role: "Research", focus: "Founder discovery" },
      { name: "Sneha Paul", role: "Placement Ops", focus: "Opportunity matching" },
    ],
    clubs: [
      { name: "Innovation Council", stage: "Active", contribution: "Workshops and founder connects" },
      { name: "Analytics Club", stage: "Engaged", contribution: "Research operations" },
      { name: "Media Cell", stage: "Prospect", contribution: "Reach and promotion" },
    ],
    research: [
      { company: "Rage Coffee", type: "Brand", status: "Research", angle: "Sampling and creator trials" },
      { company: "T-Hub", type: "Industry Partner", status: "Scored", angle: "Startup introductions and panels" },
    ],
  },
};

export const accessEvents: AccessEvent[] = [
  {
    id: "evt1",
    actor: "Aditi Rao",
    action: "Requested sponsor export access",
    target: "Atlas Pod / Headstart Network",
    level: "Warning",
    ts: "12 mins ago",
  },
  {
    id: "evt2",
    actor: "System",
    action: "Blocked stale ex-member session",
    target: "Forge Pod / ex-member token",
    level: "Critical",
    ts: "27 mins ago",
  },
  {
    id: "evt3",
    actor: "Mayank Admin",
    action: "Approved pod lead reassignment",
    target: "Orbit Pod",
    level: "Info",
    ts: "1 hr ago",
  },
  {
    id: "evt4",
    actor: "Nexus Pod",
    action: "Phone verification reset requested",
    target: "Riya Sharma",
    level: "Warning",
    ts: "2 hrs ago",
  },
];

export const todayPriorities: PriorityItem[] = [
  {
    id: "pri1",
    owner: "Atlas Pod",
    action: "Proposal not sent after partner call",
    target: "Headstart Network",
    level: "Warning",
    ts: "Due today",
  },
  {
    id: "pri2",
    owner: "Forge Pod",
    action: "Campus sponsor thread is at risk",
    target: "Forge Campus Collective",
    level: "Critical",
    ts: "18 hrs stale",
  },
  {
    id: "pri3",
    owner: "Nexus Pod",
    action: "Opportunity shortlist needs approvals",
    target: "Zomato District activation crew",
    level: "Info",
    ts: "Before 5 pm",
  },
  {
    id: "pri4",
    owner: "Orbit Pod",
    action: "Follow-up owner not assigned",
    target: "2 warm brand conversations",
    level: "Warning",
    ts: "Overdue 1 day",
  },
];

export const pipelineStages: PipelineStageMetric[] = [
  {
    id: "stage_research",
    label: "Still in research layer",
    count: "21",
    hint: "Leads being profiled, scored, or clarified before outreach starts.",
  },
  {
    id: "stage_rolodex",
    label: "In rolodex",
    count: "14",
    hint: "Leads already in outreach or follow-up motion and need next actions.",
  },
  {
    id: "stage_client",
    label: "Nexus client",
    count: "6",
    hint: "Live client-facing conversations that now need delivery and owner clarity.",
  },
];

export const moduleCoverage = [
  { name: "Research HIVE", adoption: 88, freshness: "Updated 2h ago" },
  { name: "Rolodex", adoption: 74, freshness: "8 follow-ups overdue" },
  { name: "Talent Map", adoption: 81, freshness: "3 pods need role cleanup" },
  { name: "Placement Agent", adoption: 66, freshness: "2 opportunity queues stale" },
  { name: "Partner Ops", adoption: 79, freshness: "6 active sponsorship boards" },
];
