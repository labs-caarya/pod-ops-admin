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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Opens in a new tab; `to` is treated as an absolute URL. */
  external?: boolean;
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
      { label: "Pod Portfolio", to: "/pods", icon: Network },
      { label: "Challenge Vault", to: "/challenges", icon: Vault },
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
