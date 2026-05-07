import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { notificationsAPI } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const typeIcons = {
  task_assigned: '📋',
  task_completed: '✅',
  task_overdue: '⚠️',
  task_commented: '💬',
  project_invite: '📁',
  project_update: '🔄',
  team_invite: '👥',
  mention: '@',
  deadline_reminder: '⏰',
  system: '🔔'
};

export default function NotificationPanel({ onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getAll({ limit: 15 });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
      onUnreadCountChange?.(data.unreadCount);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    await notificationsAPI.markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    const newCount = Math.max(0, unreadCount - 1);
    setUnreadCount(newCount);
    onUnreadCountChange?.(newCount);
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    onUnreadCountChange?.(0);
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id) => {
    const notif = notifications.find(n => n._id === id);
    await notificationsAPI.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (notif && !notif.isRead) {
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      onUnreadCountChange?.(newCount);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-modal z-50 animate-slide-down overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600 dark:text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
            >
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                {typeIcons[notification.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notification.isRead ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                  {notification.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkRead(notification._id)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                    title="Mark as read"
                  >
                    <Check size={12} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification._id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
