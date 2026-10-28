import {
  LayoutDashboard,
  ClipboardList,
  Network,
  BookOpen,
  Vault,
  FileText,
  CalendarDays,
  HardDrive,
  Flag,
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
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Quarterly Goals", to: "/quarterly-goals", icon: Flag },
      { label: "Content Studio", to: "/content", icon: FileText },
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
];
