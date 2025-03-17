import { LucideIcon } from "lucide-react";

export enum UserRole {
  CEO = "CEO",
  Manager = "Manager",
  Supervisor = "Supervisor",
  Accountant = "Accountant",
}

export enum Status {
  APPROVED = "Approve",
  DECLINED = "Declined",
  PENDING = "Pending",
}

export type UserType = {
  user_id: number;
  password_hash: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
};

export type ChequeType = {
  cheque_number: string;
  amount: number;
  client_name: string;
  cheque_id?: number;
  date?: string;
  issue_date?: string;
  status: Status;
  required_signatures?: number;
  current_signatures?: number;
  first_signature_user_id?: number | null;
  second_signature_user_id?: number | null;
  remarks?: string;
};

export type NavItem = {
  icon: LucideIcon;
  label: string;
  route: string;
  section?: string;
  badge?: number;
  description: string;
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
