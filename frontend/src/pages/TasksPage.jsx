import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, CheckSquare, SlidersHorizontal } from 'lucide-react';
import { tasksAPI, projectsAPI } from '../lib/api';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: '',
    project: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters.status, filters.priority, filters.project]);

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.data);
    } catch {}
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status && filters.status !== 'overdue') params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await tasksAPI.update(taskId, { status });
      setTasks(prev => prev.map(t => t._id === taskId ? data.data : t));
    } catch {
      toast.error('Failed to update task');
    }
  };

  const filtered = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status === 'overdue') {
      return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    }
    return true;
  });

  const grouped = {
    'in-progress': filtered.filter(t => t.status === 'in-progress'),
    'todo': filtered.filter(t => t.status === 'todo'),
    'in-review': filtered.filter(t => t.status === 'in-review'),
    'completed': filtered.filter(t => t.status === 'completed')
  };

  const selectedProject = projects.find(p => p._id === filters.project);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowTaskModal(true)} className="btn-primary" disabled={projects.length === 0}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search tasks..."
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${showFilters ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-300' : ''}`}
        >
          <SlidersHorizontal size={15} /> Filters
          {(filters.status || filters.priority || filters.project) && (
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-3 animate-slide-down">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input w-auto">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="input w-auto">
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })} className="input w-auto">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {(filters.status || filters.priority || filters.project) && (
            <button
              onClick={() => setFilters({ ...filters, status: '', priority: '', project: '' })}
              className="btn-ghost btn-sm text-red-500"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Tasks */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={filters.search || filters.status || filters.priority ? 'Try adjusting your filters' : 'Create your first task to get started'}
          action={!filters.search && !filters.status && !filters.priority && projects.length > 0 && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary">
              <Plus size={16} /> Create Task
            </button>
          )}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([status, statusTasks]) => {
            if (statusTasks.length === 0) return null;
            const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'in-review': 'In Review', 'completed': 'Completed' };
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{labels[status]}</h3>
                  <span className="badge-neutral">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        title={editTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={editTask}
          projectId={editTask?.project?._id || editTask?.project || filters.project || projects[0]?._id}
          projectMembers={
            (editTask?.project?._id || filters.project)
              ? (projects.find(p => p._id === (editTask?.project?._id || filters.project))?.members?.map(m => m.user).filter(Boolean) || [])
              : []
          }
          onSuccess={(task) => {
            if (editTask) {
              setTasks(prev => prev.map(t => t._id === task._id ? task : t));
            } else {
              setTasks(prev => [task, ...prev]);
            }
            setShowTaskModal(false);
            setEditTask(null);
            toast.success(editTask ? 'Task updated!' : 'Task created!');
          }}
          onCancel={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      </Modal>
    </div>
  );
}
