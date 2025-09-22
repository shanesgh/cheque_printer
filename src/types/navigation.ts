import { LucideIcon } from "lucide-react";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  route: string;
  section?: string;
  badge?: number;
  description: string;
  permission?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type SidebarContextType = {
  isExpanded: boolean;
  toggleExpanded: () => void;
};

export type SidebarAnimationConfig = {
  duration: number;
  ease: string;
};

export type SidebarLayoutConfig = {
  expandedWidth: number;
  collapsedWidth: number;
  headerHeight: number;
  itemHeight: number;
  iconSize: number;
};

export type SidebarThemeConfig = {
  backgroundColor: string;
  hoverColor: string;
  textColor: string;
  mutedText: string;
  borderColor: string;
};

export type AnimationVariant = {
  width?: number;
  opacity?: number;
  x?: number;
  transition: {
    duration: number;
    ease: string;
  };
};

export type ButtonVariantConfig = {
  default: string;
  active: string;
};

export type ButtonVariants = {
  icon: ButtonVariantConfig;
  text: ButtonVariantConfig;
};