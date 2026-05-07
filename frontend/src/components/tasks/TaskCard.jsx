import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Calendar, MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { format, isPast } from 'date-fns';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, compact = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const checklistDone = task.checklist?.filter(c => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task._id);
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className={`card p-4 group hover:shadow-card-hover transition-all duration-200 ${compact ? 'p-3' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Status checkbox */}
          <button
            onClick={() => onStatusChange?.(task._id, task.status === 'completed' ? 'todo' : 'completed')}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              task.status === 'completed'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
            }`}
          >
            {task.status === 'completed' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-sm font-medium leading-snug ${task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                {task.title}
              </h4>

              {/* Menu */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
                >
                  <MoreVertical size={14} />
                </button>
                {showMenu && (
                  <div className="dropdown right-0 top-6">
                    <button className="dropdown-item w-full" onClick={() => { onEdit?.(task); setShowMenu(false); }}>
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      className="dropdown-item w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!compact && task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />

              {task.dueDate && (
                <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  <Calendar size={11} />
                  {format(new Date(task.dueDate), 'MMM d')}
                  {isOverdue && ' (overdue)'}
                </span>
              )}

              {checklistTotal > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <CheckSquare size={11} />
                  {checklistDone}/{checklistTotal}
                </span>
              )}

              {task.comments?.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <MessageSquare size={11} />
                  {task.comments.length}
                </span>
              )}

              {task.estimatedHours > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <Clock size={11} />
                  {task.loggedHours || 0}/{task.estimatedHours}h
                </span>
              )}
            </div>

            {task.assignees?.length > 0 && (
              <div className="mt-2">
                <AvatarGroup users={task.assignees} max={3} size="xs" />
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </>
  );
}
