// =====================================================
// P5 - 用户设置页面
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, Save, RotateCcw, Bell, BookOpen, Sparkles, Palette, User, Check, AlertCircle, Plus, X, Clock, CheckCircle } from 'lucide-react';
import { AppView } from '../types';
import { getUserSettings, updateUserSettings, getDefaultSettings } from '../src/api/settings';
import { getReminderList, createReminder, deleteReminder, completeReminder } from '../src/api/reminders';
import { getUser, setUser, clearToken, isLoggedIn, debugLogin, setToken } from '../src/api/auth';
import { exportData, getSyncStatus, triggerSync } from '../src/api/export';
import type { UserSettingsResponse, UpdateSettingsRequest, DefaultSettingsResponse, UserType, Reminder, CreateReminderRequest, SyncStatus } from '../types';

interface SettingsProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState<CreateReminderRequest>({
    type: 'study_time',
    title: '',
    message: '',
    scheduledAt: new Date().toISOString(),
  });

  // Export/Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.error || '获取设置失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle field change
  const handleChange = (section: string, field: string, value: unknown) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...(settings as any)[section],
        [field]: value,
      },
    });
    setHasChanges(true);
    setSuccess(null);
  };

  // Handle schedule change
  const handleScheduleChange = (period: 'morning' | 'afternoon' | 'evening', type: 'start' | 'end', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      schedule: {
        ...settings.schedule,
        [period]: {
          ...settings.schedule?.[period],
          [type]: value,
        },
      },
    });
    setHasChanges(true);
    setSuccess(null);
  };

  // Handle schedule enabled toggle
  const handleScheduleEnabledChange = (enabled: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      schedule: {
        ...settings.schedule,
        enabled,
      },
    });
    setHasChanges(true);
    setSuccess(null);
  };

  // Handle displayName change
  const handleDisplayNameChange = (value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      displayName: value,
    });
    setHasChanges(true);
    setSuccess(null);
  };

  // Save settings
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: UpdateSettingsRequest = {
        displayName: settings.displayName,
        learning: settings.learning,
        notifications: settings.notifications,
        ai: settings.ai,
        display: settings.display,
        schedule: settings.schedule,
      };

      const response = await updateUserSettings(updateData);
      if (response.success && response.data) {
        setSettings(response.data);
        // Update stored user info
        const currentUser = getUser();
        if (currentUser) {
          setUser({ ...currentUser, displayName: settings.displayName });
        }
        setHasChanges(false);
        setSuccess('设置已保存');
      } else {
        setError(response.error || '保存设置失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    setLoading(true);
    try {
      const response = await getDefaultSettings();
      if (response.success && response.data && settings) {
        setSettings({
          ...settings,
          learning: response.data.learning,
          notifications: response.data.notifications,
          ai: response.data.ai,
          display: response.data.display,
        });
        setHasChanges(true);
      }
    } catch (err) {
      setError('重置失败');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    // 确保已登录
    if (!isLoggedIn()) {
      console.log('[Settings] 未登录，尝试自动登录...')
      const loginResult = await debugLogin()
      if (loginResult.success && loginResult.data) {
        setToken(loginResult.data.token)
        setUser(loginResult.data.user)
      }
    }

    setRemindersLoading(true);
    try {
      const response = await getReminderList();
      if (response.success && response.data) {
        setReminders(response.data.reminders || []);
      }
    } catch (err) {
      console.error('获取提醒列表失败', err);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  // Create reminder
  const handleCreateReminder = async () => {
    if (!newReminder.title || !newReminder.scheduledAt) return;
    setLoading(true);
    try {
      const response = await createReminder(newReminder);
      if (response.success) {
        setShowReminderModal(false);
        setNewReminder({
          type: 'study_time',
          title: '',
          message: '',
          scheduledAt: new Date().toISOString(),
        });
        fetchReminders();
      }
    } catch (err) {
      console.error('创建提醒失败', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      const response = await deleteReminder(id);
      if (response.success) {
        fetchReminders();
      }
    } catch (err) {
      console.error('删除提醒失败', err);
    }
  };

  // Complete reminder
  const handleCompleteReminder = async (id: string) => {
    try {
      const response = await completeReminder(id);
      if (response.success) {
        fetchReminders();
      }
    } catch (err) {
      console.error('完成提醒失败', err);
    }
  };

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    setSyncLoading(true);
    try {
      const response = await getSyncStatus();
      if (response.success && response.data) {
        setSyncStatus(response.data);
      }
    } catch (err) {
      console.error('获取同步状态失败', err);
    } finally {
      setSyncLoading(false);
    }
  }, []);

  // Trigger sync
  const handleTriggerSync = async () => {
    setSyncLoading(true);
    try {
      const response = await triggerSync();
      if (response.success) {
        fetchSyncStatus();
      }
    } catch (err) {
      console.error('触发同步失败', err);
    } finally {
      setSyncLoading(false);
    }
  };

  // Export data
  const handleExportData = async (format: 'json' | 'csv') => {
    setExportLoading(true);
    try {
      const response = await exportData({
        format,
        dataTypes: ['courses', 'chapters', 'knowledge_points', 'study_records', 'mistakes', 'notes'],
        timeRange: undefined,
      });
      if (response.success && response.data?.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `lumilearn-export-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
      }
    } catch (err) {
      console.error('导出数据失败', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Fetch sync status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Handle logout
  const handleLogout = () => {
    clearToken();
    onNavigate(AppView.DASHBOARD);
  };

  if (loading && !settings) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate(AppView.DASHBOARD)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-black text-slate-800">设置</h1>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="p-2 rounded-full bg-slate-100 active:scale-95 transition-transform"
              title="重置"
            >
              <RotateCcw size={18} className="text-slate-500" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-1 px-4 py-2 rounded-full font-bold text-sm ${
              hasChanges
                ? 'bg-blue-600 text-white active:scale-95 transition-transform'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>保存</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}
      {success && (
        <div className="mx-4 mt-2 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-2">
          <Check size={16} className="text-green-500" />
          <span className="text-sm text-green-600">{success}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Profile Section */}
        <div className="p-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <User size={18} className="text-blue-500" />
              <h2 className="text-base font-bold text-slate-800">个人信息</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">用户名</label>
                <input
                  type="text"
                  value={settings?.username || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">邮箱</label>
                <input
                  type="email"
                  value={settings?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">显示名称</label>
                <input
                  type="text"
                  value={settings?.displayName || ''}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen size={18} className="text-green-500" />
              <h2 className="text-base font-bold text-slate-800">学习偏好</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">每日学习目标（分钟）</label>
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={settings?.learning?.dailyGoal || 60}
                  onChange={(e) => handleChange('learning', 'dailyGoal', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">每周学习目标（分钟）</label>
                <input
                  type="number"
                  min="0"
                  max="5040"
                  value={settings?.learning?.weeklyGoal || 300}
                  onChange={(e) => handleChange('learning', 'weeklyGoal', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">目标等级</label>
                <select
                  value={settings?.learning?.targetGrade || 'B'}
                  onChange={(e) => handleChange('learning', 'targetGrade', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="S">S - 卓越</option>
                  <option value="A">A - 优秀</option>
                  <option value="B">B - 良好</option>
                  <option value="C">C - 及格</option>
                </select>
              </div>

              {/* 学习时间段配置 */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-500">学习时间段</label>
                  <button
                    onClick={() => handleScheduleEnabledChange(!settings?.schedule?.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings?.schedule?.enabled ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings?.schedule?.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {settings?.schedule?.enabled && (
                  <div className="space-y-3">
                    {/* 上午时段 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 w-12">上午</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={settings?.schedule?.morning?.start || '09:00'}
                          onChange={(e) => handleScheduleChange('morning', 'start', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={settings?.schedule?.morning?.end || '12:00'}
                          onChange={(e) => handleScheduleChange('morning', 'end', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* 下午时段 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 w-12">下午</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={settings?.schedule?.afternoon?.start || '14:00'}
                          onChange={(e) => handleScheduleChange('afternoon', 'start', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={settings?.schedule?.afternoon?.end || '18:00'}
                          onChange={(e) => handleScheduleChange('afternoon', 'end', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* 晚上时段 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 w-12">晚上</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={settings?.schedule?.evening?.start || '19:00'}
                          onChange={(e) => handleScheduleChange('evening', 'start', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={settings?.schedule?.evening?.end || '21:00'}
                          onChange={(e) => handleScheduleChange('evening', 'end', e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <Bell size={18} className="text-amber-500" />
              <h2 className="text-base font-bold text-slate-800">通知设置</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-600">学习提醒</span>
                <button
                  onClick={() => handleChange('notifications', 'studyReminder', !settings?.notifications?.studyReminder)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings?.notifications?.studyReminder ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings?.notifications?.studyReminder ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-600">复习提醒</span>
                <button
                  onClick={() => handleChange('notifications', 'reviewReminder', !settings?.notifications?.reviewReminder)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings?.notifications?.reviewReminder ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings?.notifications?.reviewReminder ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-600">考试提醒</span>
                <button
                  onClick={() => handleChange('notifications', 'examReminder', !settings?.notifications?.examReminder)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings?.notifications?.examReminder ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings?.notifications?.examReminder ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">提醒时间</label>
                <input
                  type="time"
                  value={settings?.notifications?.reminderTime || '09:00'}
                  onChange={(e) => handleChange('notifications', 'reminderTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Management */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell size={18} className="text-orange-500" />
                <h2 className="text-base font-bold text-slate-800">学习提醒</h2>
              </div>
              <button
                onClick={() => setShowReminderModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold active:scale-95 transition-transform"
              >
                <Plus size={14} />
                <span>添加</span>
              </button>
            </div>

            {remindersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-blue-500" size={20} />
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">
                暂无提醒
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          reminder.status === 'completed' ? 'bg-green-500' :
                          reminder.status === 'cancelled' ? 'bg-slate-300' : 'bg-orange-500'
                        }`} />
                        <span className="text-sm font-medium text-slate-700 truncate">{reminder.title}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1 text-xs text-slate-400">
                        <Clock size={10} />
                        <span>{reminder.scheduledTime || reminder.scheduledAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {reminder.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="p-1.5 rounded-lg bg-green-100 text-green-600 active:scale-95 transition-transform"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 active:scale-95 transition-transform"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Preferences */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={18} className="text-purple-500" />
              <h2 className="text-base font-bold text-slate-800">AI 设置</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-600">自动解释</span>
                <button
                  onClick={() => handleChange('ai', 'autoExplain', !settings?.ai?.autoExplain)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings?.ai?.autoExplain ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings?.ai?.autoExplain ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-600">自动建议</span>
                <button
                  onClick={() => handleChange('ai', 'autoSuggest', !settings?.ai?.autoSuggest)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings?.ai?.autoSuggest ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings?.ai?.autoSuggest ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">AI 难度</label>
                <select
                  value={settings?.ai?.difficulty || 'medium'}
                  onChange={(e) => handleChange('ai', 'difficulty', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <Palette size={18} className="text-pink-500" />
              <h2 className="text-base font-bold text-slate-800">界面设置</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">主题</label>
                <select
                  value={settings?.display?.theme || 'light'}
                  onChange={(e) => handleChange('display', 'theme', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                  <option value="auto">跟随系统</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">语言</label>
                <select
                  value={settings?.display?.language || 'zh-CN'}
                  onChange={(e) => handleChange('display', 'language', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Export & Sync */}
        <div className="p-4 pt-0">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">数据导出与同步</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Sync Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">同步状态</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    syncStatus?.syncStatus === 'synced' ? 'bg-green-100 text-green-600' :
                    syncStatus?.syncStatus === 'syncing' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {syncStatus?.syncStatus === 'synced' ? '已同步' :
                     syncStatus?.syncStatus === 'syncing' ? '同步中' :
                     syncStatus?.syncStatus === 'pending' ? '待同步' : '未同步'}
                  </span>
                </div>
                {syncStatus?.lastSyncAt && (
                  <p className="text-xs text-slate-400">
                    上次同步: {new Date(syncStatus.lastSyncAt).toLocaleString('zh-CN')}
                  </p>
                )}
                <button
                  onClick={handleTriggerSync}
                  disabled={syncLoading}
                  className="mt-2 w-full py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center"
                >
                  {syncLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  立即同步
                </button>
              </div>

              {/* Export Data */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-sm font-medium text-slate-600 block mb-2">导出学习数据</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportData('json')}
                    disabled={exportLoading}
                    className="flex-1 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {exportLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    导出 JSON
                  </button>
                  <button
                    onClick={() => handleExportData('csv')}
                    disabled={exportLoading}
                    className="flex-1 py-2 bg-green-50 border border-green-100 rounded-xl text-sm font-medium text-green-600 hover:bg-green-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {exportLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    导出 CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 pt-0">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm active:scale-98 transition-transform"
          >
            退出登录
          </button>
        </div>

        {/* Create Reminder Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">添加提醒</h3>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">提醒类型</label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="study_time">学习提醒</option>
                    <option value="review">复习提醒</option>
                    <option value="exam">考试提醒</option>
                    <option value="goal">目标提醒</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">标题 *</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="提醒标题"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">提醒时间 *</label>
                  <input
                    type="datetime-local"
                    value={newReminder.scheduledAt?.slice(0, 16)}
                    onChange={(e) => setNewReminder({ ...newReminder, scheduledAt: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">备注</label>
                  <textarea
                    value={newReminder.message || ''}
                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    placeholder="可选备注"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-5">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateReminder}
                  disabled={!newReminder.title || !newReminder.scheduledAt || loading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
