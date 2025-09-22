// constants/sidebar.ts
import { NavSection } from "@/type";
import {
  LayoutDashboard,
  History,
  BarChart,
  Wallet,
  MessageSquare,
  FolderClosed,
  Grid,
  HelpCircle,
  Settings,
} from "lucide-react";

export const ANIMATION_DURATION = 0.2;
export const EXPANDED_WIDTH = 240;
export const COLLAPSED_WIDTH = 80;

// Animation constants
export const SIDEBAR_ANIMATION = {
  duration: 0.2,
  ease: "easeInOut",
} as const;

// Layout constants
export const SIDEBAR_LAYOUT = {
  expandedWidth: 240,
  collapsedWidth: 80,
  headerHeight: 64,
  itemHeight: 40,
  iconSize: 16,
} as const;

// Theme constants
export const SIDEBAR_THEME = {
  backgroundColor: "hsl(var(--background))",
  hoverColor: "hsl(var(--accent))",
  textColor: "hsl(var(--foreground))",
  mutedText: "hsl(var(--muted-foreground))",
  borderColor: "hsl(var(--border))",
} as const;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Operations",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        route: "/dashboard",
        description: "View your account overview",
      },

      {
        icon: BarChart,
        label: "Analysis",
        route: "/analysis",
        description: "Analyze your spending",
        badge: 0,
      },
      {
        icon: Wallet,
        label: "Finance",
        route: "/finances",
        description: "Finance dashboard and analytics",
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        icon: MessageSquare,
        label: "Messages",
        route: "/messages",
        description: "View your messages",
        badge: 9,
      },
      {
        icon: FolderClosed,
        label: "Documents",
        route: "/documents",
        description: "Access your documents",
      },
    ],
  },
  {
    title: "Other",
    items: [
      {
        icon: HelpCircle,
        label: "Help",
        route: "/help",
        description: "Get help and support",
      },
      {
        icon: Settings,
        label: "Settings",
        route: "/settings",
        description: "Manage your preferences",
      },
    ],
  },
] as const;

// Animation variants
export const SIDEBAR_VARIANTS = {
  expanded: {
    width: SIDEBAR_LAYOUT.expandedWidth,
    transition: {
      duration: SIDEBAR_ANIMATION.duration,
      ease: SIDEBAR_ANIMATION.ease,
    },
  },
  collapsed: {
    width: SIDEBAR_LAYOUT.collapsedWidth,
    transition: {
      duration: SIDEBAR_ANIMATION.duration,
      ease: SIDEBAR_ANIMATION.ease,
    },
  },
} as const;

export const CONTENT_VARIANTS = {
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: SIDEBAR_ANIMATION.duration,
      ease: SIDEBAR_ANIMATION.ease,
    },
  },
  hidden: {
    opacity: 0,
    x: -10,
    transition: {
      duration: SIDEBAR_ANIMATION.duration,
      ease: SIDEBAR_ANIMATION.ease,
    },
  },
} as const;

// Routes configuration
export const ROUTE_CONFIG = {
  defaultRoute: "/dashboard",
  publicRoutes: ["/login", "/register", "/forgot-password"],
  privateRoutes: NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => item.route)
  ),
} as const;

// User session constants
export const SESSION_CONFIG = {
  warningThreshold: 5 * 60, // 5 minutes in seconds
  expireThreshold: 9 * 60, // 9 minutes in seconds
  refreshInterval: 60, // 1 minute in seconds
} as const;

// Button variants
export const BUTTON_VARIANTS = {
  icon: {
    default: "ghost",
    active: "default",
  },
  text: {
    default: "ghost",
    active: "secondary",
  },
} as const;
