export enum UserRole {
  CEO = "CEO",
  Manager = "Manager",
  Supervisor = "Supervisor",
  Accountant = "Accountant",
  Admin = "Admin",
}

export type UserType = {
  user_id: number;
  password_hash: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  signature_image?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  last_login?: string;
  permissions?: string[];
};

export type UserPermission = {
  id: string;
  name: string;
  description: string;
  category: 'cheques' | 'users' | 'system' | 'reports';
};