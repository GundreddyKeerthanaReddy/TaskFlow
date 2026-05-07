import { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Shield, Save } from 'lucide-react';
import { usersAPI, authAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [notifications, setNotifications] = useState(user?.notifications || {
    email: true, push: true, taskAssigned: true, taskCompleted: true, projectUpdates: true, weeklyDigest: false
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      const { data } = await usersAPI.updateSettings({ notifications });
      updateUser(data.data);
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await usersAPI.updateSettings({ theme: newTheme });
      updateUser({ theme: newTheme });
    } catch {}
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your TaskFlow experience</p>
      </div>

      {/* Theme */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sun size={16} /> Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' }
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon size={20} className={theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'} />
              <span className={`text-sm font-medium ${theme === value ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
            { key: 'push', label: 'Push notifications', desc: 'Browser push notifications' },
            { key: 'taskAssigned', label: 'Task assigned', desc: 'When a task is assigned to you' },
            { key: 'taskCompleted', label: 'Task completed', desc: 'When your tasks are completed' },
            { key: 'projectUpdates', label: 'Project updates', desc: 'Changes to your projects' },
            { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Weekly summary email' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
              <ToggleSwitch
                checked={notifications[key] ?? true}
                onChange={(val) => setNotifications(prev => ({ ...prev, [key]: val }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSaveNotifications} disabled={savingNotifs} className="btn-primary btn-sm">
            {savingNotifs ? 'Saving...' : <><Save size={14} /> Save Preferences</>}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Shield size={16} /> Security
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input"
              placeholder="Min. 6 characters"
              required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input"
              placeholder="Repeat new password"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPass"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-600"
            />
            <label htmlFor="showPass" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Show passwords</label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword} className="btn-primary btn-sm">
              {savingPassword ? 'Changing...' : <><Shield size={14} /> Change Password</>}
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Role</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500 dark:text-slate-400">Member since</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
