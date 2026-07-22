import {
  LayoutDashboard,
  Network,
  Building2,
  UserRound,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Vault,
  Castle,
  Briefcase,
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
      { label: "Pod Portfolio", to: "/pods", icon: Network },
      { label: "Pod Registry", to: "/pods-admin", icon: Building2 },
      { label: "Leadership", to: "/access", icon: UserRound },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Challenge Vault", to: "/challenges", icon: Vault },
      { label: "Leader goals", to: "/leader-goals", icon: ClipboardList },
      { label: "Pod mentors", to: "/mentors", icon: BookOpen },
    ],
  },
  {
    heading: "Applicants",
    items: [
      { label: "Futurecraft", to: "/applicants/futurecraft", icon: GraduationCap },
      { label: "Castle", to: "/applicants/castle", icon: Castle },
      { label: "Industry", to: "/applicants/industry", icon: Briefcase },
    ],
  },
];
