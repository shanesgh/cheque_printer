import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, SecuritySettings, SystemSettings, NotificationSettings } from '@/types/settings';

interface SettingsStore {
  settings: AppSettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: AppSettings = {
  security: {
    session_timeout: 30,
    max_login_attempts: 5,
    password_expiry_days: 90,
    require_2fa: false,
    audit_retention_days: 365,
    ip_whitelist: [],
  },
  system: {
    app_name: 'Cheque Management System',
    app_version: '1.0.0',
    database_path: './storage.db',
    backup_enabled: true,
    backup_frequency: 'daily',
    max_file_size_mb: 50,
    allowed_file_types: ['.xlsx', '.xls'],
  },
  notifications: {
    email_notifications: true,
    high_value_alerts: true,
    approval_reminders: true,
    system_alerts: true,
    alert_threshold_amount: 10000,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSecuritySettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            security: { ...state.settings.security, ...newSettings },
          },
        })),
      
      updateSystemSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            system: { ...state.settings.system, ...newSettings },
          },
        })),
      
      updateNotificationSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...newSettings },
          },
        })),
      
      resetToDefaults: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'settings-store',
    }
  )
);