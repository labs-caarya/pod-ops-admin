import {
  LayoutDashboard,
  Network,
  Building2,
  UserRound,
  GraduationCap,
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
      { label: "Future Craft Applicants", to: "/future-craft-applicants", icon: GraduationCap },
    ],
  },
];
