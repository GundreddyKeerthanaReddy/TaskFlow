import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, TrendingUp, AlertCircle,
  Clock, ArrowRight, Activity, Users, Zap
} from 'lucide-react';
import { analyticsAPI, activitiesAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { StatSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to || '#'} className="stat-card hover:shadow-card-hover transition-all duration-200 group">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
  </Link>
);

const activityActionMap = {
  created: { label: 'created', color: 'text-emerald-600 dark:text-emerald-400' },
  updated: { label: 'updated', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'completed', color: 'text-emerald-600 dark:text-emerald-400' },
  status_changed: { label: 'moved', color: 'text-purple-600 dark:text-purple-400' },
  commented: { label: 'commented on', color: 'text-amber-600 dark:text-amber-400' },
  assigned: { label: 'assigned', color: 'text-blue-600 dark:text-blue-400' },
  deleted: { label: 'deleted', color: 'text-red-600 dark:text-red-400' }
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, prodRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getProductivity({ period: '7' })
      ]);
      setStats(dashRes.data.data.overview);
      setActivities(dashRes.data.data.recentActivity);
      setChartData(prodRes.data.data.dailyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn-primary hidden sm:flex">
          <Zap size={16} /> New Project
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={FolderKanban}
              label="Total Projects"
              value={stats?.totalProjects || 0}
              sub={`${stats?.activeProjects || 0} active`}
              color="bg-primary-500"
              to="/projects"
            />
            <StatCard
              icon={CheckSquare}
              label="Total Tasks"
              value={stats?.totalTasks || 0}
              sub={`${stats?.completionRate || 0}% completion rate`}
              color="bg-emerald-500"
              to="/tasks"
            />
            <StatCard
              icon={TrendingUp}
              label="Completed"
              value={stats?.completedTasks || 0}
              sub={`${stats?.weeklyCompleted || 0} this week`}
              color="bg-blue-500"
              to="/analytics"
            />
            <StatCard
              icon={AlertCircle}
              label="Overdue"
              value={stats?.overdueTasks || 0}
              sub="Need attention"
              color={stats?.overdueTasks > 0 ? 'bg-red-500' : 'bg-slate-400'}
              to="/tasks?status=overdue"
            />
          </>
        )}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Task Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</p>
            </div>
            <Link to="/analytics" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--toast-bg)', border: '1px solid var(--toast-border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#colorCompleted)" name="Completed" />
                <Area type="monotone" dataKey="created" stroke="#10b981" strokeWidth={2} fill="url(#colorCreated)" name="Created" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              activities.map((activity) => {
                const actionInfo = activityActionMap[activity.action] || { label: activity.action, color: 'text-slate-600' };
                return (
                  <div key={activity._id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary-700 dark:text-primary-400">
                      {activity.actor?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-medium">{activity.actor?.name}</span>{' '}
                        <span className={actionInfo.color}>{actionInfo.label}</span>{' '}
                        <span className="font-medium truncate">{activity.entityTitle}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/projects', icon: FolderKanban, label: 'Projects', color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' },
          { to: '/tasks', icon: CheckSquare, label: 'My Tasks', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
          { to: '/team', icon: Users, label: 'Team', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
          { to: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' }
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
