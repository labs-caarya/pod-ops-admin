import {
  LayoutDashboard,
  ClipboardList,
  Network,
  BookOpen,
  Vault,
  FileText,
  CalendarDays,
  ListChecks,
  HardDrive,
  Handshake,
  Flag,
  Microscope,
  Contact2,
  Building2,
  Users,
  BriefcaseBusiness,
  UserCheck,
  Newspaper,
  Sparkles,
  GraduationCap,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Opens in a new tab; `to` is treated as an absolute URL. */
  external?: boolean;
  crewManager?: boolean;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
      { label: "Progress Report", to: "/progress-report", icon: ClipboardList },
      { label: "Pod Portfolio", to: "/pods", icon: Network, crewManager: true },
      { label: "Challenge Vault", to: "/challenges", icon: Vault, crewManager: true },
      { label: "Community News", to: "/community-news", icon: Newspaper },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Pod Registry", to: "/pods-admin", icon: Building2 },
      { label: "Quarterly Targets", to: "/quarterly-targets", icon: Flag },
      { label: "Content Studio", to: "/content", icon: FileText },
      { label: "Program Management", to: "/programs", icon: ListChecks },
      { label: "Event Management", to: "/events", icon: CalendarDays },
      { label: "Knowledge Space", to: "/knowledge-space", icon: BookOpen },
      {
        label: "cdrive",
        to: "https://c-drive-employee.web.app/",
        icon: HardDrive,
        external: true,
      },
    ],
  },
  {
    heading: "Experience",
    items: [
      { label: "Experience Credits", to: "/experience", icon: Sparkles, crewManager: true },
      { label: "Talent Referrals", to: "/talent-referrals", icon: UserPlus, crewManager: true },
      { label: "Assessments", to: "/assessments", icon: GraduationCap },
      { label: "Internal Events", to: "/internal-events", icon: CalendarCheck },
    ],
  },
  {
    heading: "Business",
    items: [
      { label: "Partners", to: "/partners", icon: Handshake },
      { label: "Talent Map", to: "/talent-map", icon: Users },
      { label: "Research HIVE", to: "/research", icon: Microscope },
      { label: "Rolodex", to: "/rolodex", icon: Contact2 },
      { label: "Opportunities", to: "/opportunities", icon: BriefcaseBusiness },
      { label: "Placement Agent", to: "/placement", icon: UserCheck },
    ],
  },
];
