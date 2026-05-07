export const priorityConfig = {
  critical: { label: 'Critical', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  high: { label: 'High', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  medium: { label: 'Medium', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  low: { label: 'Low', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-400' }
};

export const statusConfig = {
  'todo': { label: 'To Do', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'in-progress': { label: 'In Progress', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'in-review': { label: 'In Review', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'completed': { label: 'Completed', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
};

export const projectStatusConfig = {
  'planning': { label: 'Planning', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'active': { label: 'Active', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'on-hold': { label: 'On Hold', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'completed': { label: 'Completed', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'cancelled': { label: 'Cancelled', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
};

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`badge ${config.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.todo;
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}

export function ProjectStatusBadge({ status }) {
  const config = projectStatusConfig[status] || projectStatusConfig.planning;
  return <span className={`badge ${config.class}`}>{config.label}</span>;
}
