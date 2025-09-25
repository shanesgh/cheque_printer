import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/userStore";
import { useSettingsStore } from "@/store/settingsStore";
import { UserRole, UserType } from "@/types";
import { Shield, Users, Database, Bell, Trash2, Edit, Plus } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { firstName, lastName, email, role, users, setUserData, addUser, updateUser, deleteUser } = useUserStore();
  const { settings, updateSecuritySettings, updateSystemSettings, updateNotificationSettings } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'users' | 'system' | 'notifications'>('profile');
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const [localEmail, setLocalEmail] = useState(email);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserType>>({
    first_name: '',
    last_name: '',
    email: '',
    role: UserRole.Accountant,
    is_active: true,
  });

  const getInitials = () => {
    return `${localFirstName.charAt(0)}${localLastName.charAt(0)}`.toUpperCase();
  };

  const handleSave = () => {
    setUserData({
      firstName: localFirstName,
      lastName: localLastName,
      email: localEmail,
    });
  };

  const handleAddUser = () => {
    if (newUser.first_name && newUser.last_name && newUser.email) {
      const user: UserType = {
        user_id: Date.now(),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role || UserRole.Accountant,
        password_hash: 'temp_hash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };
      addUser(user);
      setNewUser({ first_name: '', last_name: '', email: '', role: UserRole.Accountant, is_active: true });
      setShowAddUser(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <Card>
            <CardContent className="p-4">
              <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap ${
                        activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={localFirstName} onChange={(e) => setLocalFirstName(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={localLastName} onChange={(e) => setLocalLastName(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Badge variant="secondary">{role}</Badge>
                </div>
                
                <Button className="w-full" onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={settings.security.session_timeout}
                      onChange={(e) => updateSecuritySettings({ session_timeout: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Max Login Attempts</label>
                    <Input
                      type="number"
                      value={settings.security.max_login_attempts}
                      onChange={(e) => updateSecuritySettings({ max_login_attempts: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Require 2FA</label>
                      <p className="text-xs text-gray-500">Enable two-factor authentication</p>
                    </div>
                    <Switch
                      checked={settings.security.require_2fa}
                      onCheckedChange={(checked) => updateSecuritySettings({ require_2fa: checked })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Audit Retention (days)</label>
                    <Input
                      type="number"
                      value={settings.security.audit_retention_days}
                      onChange={(e) => updateSecuritySettings({ audit_retention_days: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Button onClick={() => setShowAddUser(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {showAddUser && (
                  <div className="mb-6 p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Add New User</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                      />
                      <Input
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                      <select
                        className="border rounded px-3 py-2"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddUser}>Add User</Button>
                      <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteUser(user.user_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Application Name</label>
                  <Input
                    value={settings.system.app_name}
                    onChange={(e) => updateSystemSettings({ app_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Max File Size (MB)</label>
                  <Input
                    type="number"
                    value={settings.system.max_file_size_mb}
                    onChange={(e) => updateSystemSettings({ max_file_size_mb: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable Backups</label>
                    <p className="text-xs text-gray-500">Automatically backup database</p>
                  </div>
                  <Switch
                    checked={settings.system.backup_enabled}
                    onCheckedChange={(checked) => updateSystemSettings({ backup_enabled: checked })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Backup Frequency</label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={settings.system.backup_frequency}
                    onChange={(e) => updateSystemSettings({ backup_frequency: e.target.value as any })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-xs text-gray-500">Receive email alerts</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateNotificationSettings({ email_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">High Value Alerts</label>
                    <p className="text-xs text-gray-500">Alert for high-value cheques</p>
                  </div>
                  <Switch
                    checked={settings.notifications.high_value_alerts}
                    onCheckedChange={(checked) => updateNotificationSettings({ high_value_alerts: checked })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Alert Threshold Amount ($)</label>
                  <Input
                    type="number"
                    value={settings.notifications.alert_threshold_amount}
                    onChange={(e) => updateNotificationSettings({ alert_threshold_amount: parseInt(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}