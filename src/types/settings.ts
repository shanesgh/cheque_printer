export type SecuritySettings = {
  session_timeout: number;
  max_login_attempts: number;
  password_expiry_days: number;
  require_2fa: boolean;
  audit_retention_days: number;
  ip_whitelist: string[];
};

export type SystemSettings = {
  app_name: string;
  app_version: string;
  database_path: string;
  backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  max_file_size_mb: number;
  allowed_file_types: string[];
};

export type NotificationSettings = {
  email_notifications: boolean;
  high_value_alerts: boolean;
  approval_reminders: boolean;
  system_alerts: boolean;
  alert_threshold_amount: number;
};

export type AppSettings = {
  security: SecuritySettings;
  system: SystemSettings;
  notifications: NotificationSettings;
};