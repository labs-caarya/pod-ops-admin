import {
  LayoutDashboard,
  Network,
  Building2,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Vault,
  Rocket,
  Castle,
  Briefcase,
  CalendarRange,
  FileText,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Admin overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
      { label: "Daily & weekly", to: "/reports", icon: CalendarRange },
      { label: "Pod Portfolio", to: "/pods", icon: Network },
      { label: "Pod Registry", to: "/pods-admin", icon: Building2 },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Challenge Vault", to: "/challenges", icon: Vault },
      { label: "Pod Activation", to: "/pod-activation", icon: Rocket },
      { label: "Leader goals", to: "/leader-goals", icon: ClipboardList },
      { label: "Pod mentors", to: "/mentors", icon: BookOpen },
      { label: "Knowledge Space", to: "/knowledge-space", icon: BookOpen },
      { label: "Content Studio", to: "/content", icon: FileText },
      { label: "Event Management", to: "/events", icon: CalendarDays },
    ],
  },
  {
    heading: "Applicants",
    items: [
      { label: "Observership", to: "/applicants/futurecraft", icon: GraduationCap },
      { label: "Castle", to: "/applicants/castle", icon: Castle },
      { label: "Industry", to: "/applicants/industry", icon: Briefcase },
    ],
  },
];
