import { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckSquare, Clock } from 'lucide-react';
import { analyticsAPI } from '../lib/api';
import ProgressBar from '../components/ui/ProgressBar';
import Avatar from '../components/ui/Avatar';
import { StatSkeleton } from '../components/ui/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#94a3b8' };
const STATUS_COLORS = { 'todo': '#94a3b8', 'in-progress': '#3b82f6', 'in-review': '#8b5cf6', 'completed': '#10b981' };
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, teamRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getProductivity({ period }),
        analyticsAPI.getTeam()
      ]);
      setDashboard(dashRes.data.data.overview);
      setProductivity(prodRes.data.data);
      setTeamData(teamRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track productivity and team performance</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input w-auto">
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            {[
              { icon: TrendingUp, label: 'Completion Rate', value: `${dashboard?.completionRate || 0}%`, sub: `${dashboard?.completedTasks || 0} completed`, color: 'bg-emerald-500' },
              { icon: CheckSquare, label: 'Total Tasks', value: dashboard?.totalTasks || 0, sub: `${dashboard?.inProgressTasks || 0} in progress`, color: 'bg-blue-500' },
              { icon: Clock, label: 'Overdue Tasks', value: dashboard?.overdueTasks || 0, sub: 'Need attention', color: dashboard?.overdueTasks > 0 ? 'bg-red-500' : 'bg-slate-400' },
              { icon: Users, label: 'Active Projects', value: dashboard?.activeProjects || 0, sub: `${dashboard?.totalProjects || 0} total`, color: 'bg-primary-500' }
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="stat-card">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Task activity */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Activity</h3>
          {loading ? (
            <div className="h-56 skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={productivity?.dailyData || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--toast-bg)', border: '1px solid var(--toast-border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#gradCompleted)" name="Completed" />
                <Area type="monotone" dataKey="created" stroke="#10b981" strokeWidth={2} fill="url(#gradCreated)" name="Created" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Status Distribution</h3>
          {loading ? (
            <div className="h-56 skeleton rounded-lg" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={productivity?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(productivity?.statusDistribution || []).map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--toast-bg)', border: '1px solid var(--toast-border)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(productivity?.statusDistribution || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || CHART_COLORS[i] }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{item.name?.replace('-', ' ')}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project progress */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Project Progress</h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-8 skeleton rounded" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {(productivity?.projectProgress || []).map((project, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{project.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {project.completed}/{project.total} tasks
                    </span>
                  </div>
                  <ProgressBar value={project.progress} color="auto" showLabel />
                </div>
              ))}
              {(!productivity?.projectProgress || productivity.projectProgress.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">No project data available</p>
              )}
            </div>
          )}
        </div>

        {/* Team performance */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Team Performance</h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(teamData?.memberStats || []).slice(0, 6).map(({ user, assigned, completed, completionRate }) => (
                <div key={user._id} className="flex items-center gap-3">
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{user.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{completed}/{assigned}</span>
                    </div>
                    <ProgressBar value={completionRate} size="sm" color="auto" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">{completionRate}%</span>
                </div>
              ))}
              {(!teamData?.memberStats || teamData.memberStats.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">No team data available</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Priority distribution bar chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Tasks by Priority</h3>
        {loading ? (
          <div className="h-48 skeleton rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={productivity?.priorityDistribution || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--toast-bg)', border: '1px solid var(--toast-border)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {(productivity?.priorityDistribution || []).map((entry, index) => (
                  <Cell key={index} fill={PRIORITY_COLORS[entry.name] || CHART_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
