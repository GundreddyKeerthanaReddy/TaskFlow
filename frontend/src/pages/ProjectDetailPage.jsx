import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Kanban, List, Plus, Settings, Users, BarChart3, Edit, Trash2 } from 'lucide-react';
import { projectsAPI, tasksAPI } from '../lib/api';
import { ProjectStatusBadge, PriorityBadge } from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { AvatarGroup } from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProjectForm from '../components/projects/ProjectForm';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, statsRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll({ project: id }),
        projectsAPI.getStats(id)
      ]);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
      setDeleting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => !statusFilter || t.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/projects" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${id}/kanban`} className="btn-secondary btn-sm">
            <Kanban size={14} /> Kanban Board
          </Link>
          <button onClick={() => setShowEditModal(true)} className="btn-secondary btn-sm">
            <Edit size={14} /> Edit
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn-sm btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Project header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: project.color + '20', border: `2px solid ${project.color}40` }}
          >
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ProjectStatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <AvatarGroup users={project.members?.map(m => m.user).filter(Boolean) || []} max={5} size="sm" />
                <span className="text-xs text-slate-500">{project.members?.length || 0} members</span>
              </div>
              {project.dueDate && (
                <span className={`text-xs ${new Date(project.dueDate) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                  Due {format(new Date(project.dueDate), 'MMM d, yyyy')}
                </span>
              )}
              {project.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {project.tags.map(tag => (
                    <span key={tag} className="badge-neutral">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Overall Progress</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{project.progress || 0}%</span>
              </div>
              <ProgressBar value={project.progress || 0} size="md" color="auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Tasks', value: stats.total, color: 'text-slate-700 dark:text-slate-300' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400' }
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tasks</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto text-xs py-1"
            >
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-sm">
            <Plus size={14} /> Add Task
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={List}
            title="No tasks yet"
            description="Add tasks to track progress on this project"
            action={
              <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-sm">
                <Plus size={14} /> Add First Task
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                onDelete={handleDeleteTask}
                onStatusChange={async (taskId, status) => {
                  try {
                    const { data } = await tasksAPI.update(taskId, { status });
                    setTasks(prev => prev.map(t => t._id === taskId ? data.data : t));
                  } catch { toast.error('Failed to update task'); }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit project modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project" size="md">
        <ProjectForm
          project={project}
          onSuccess={(updated) => { setProject(updated); setShowEditModal(false); toast.success('Project updated!'); }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Task modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        title={editTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={editTask}
          projectId={id}
          projectMembers={project.members?.map(m => m.user).filter(Boolean) || []}
          onSuccess={(task) => {
            if (editTask) {
              setTasks(prev => prev.map(t => t._id === task._id ? task : t));
            } else {
              setTasks(prev => [...prev, task]);
            }
            setShowTaskModal(false);
            setEditTask(null);
            toast.success(editTask ? 'Task updated!' : 'Task created!');
          }}
          onCancel={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      </Modal>

      {/* Delete project confirm */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Delete "${project.name}"? This will permanently delete all ${tasks.length} tasks.`}
        confirmLabel="Delete Project"
        isLoading={deleting}
      />
    </div>
  );
}
