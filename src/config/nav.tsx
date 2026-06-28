import {
  LayoutDashboard,
  Network,
  Building2,
  ShieldCheck,
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
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Users", to: "/access", icon: ShieldCheck },
      { label: "Future Craft Applicants", to: "/future-craft-applicants", icon: GraduationCap },
    ],
  },
];
