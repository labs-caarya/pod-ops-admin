import {
  LayoutDashboard,
  Microscope,
  Contact2,
  Users,
  Briefcase,
  Building2,
  Sparkles,
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
    heading: "Overview",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
  },
  {
    heading: "Grow the network",
    items: [
      { label: "Research · HIVE", to: "/research", icon: Microscope },
      { label: "Rolodex", to: "/rolodex", icon: Contact2 },
      { label: "Partners", to: "/partners", icon: Building2 },
    ],
  },
  {
    heading: "Mobilise talent",
    items: [
      { label: "Talent Map", to: "/talent", icon: Users },
      { label: "Opportunities", to: "/opportunities", icon: Briefcase },
    ],
  },
  {
    heading: "Assist",
    items: [{ label: "Ask Moksha", to: "/ask", icon: Sparkles }],
  },
];
