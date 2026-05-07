import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, MoreVertical, Trash2, Edit, ExternalLink } from 'lucide-react';
import { projectsAPI } from '../lib/api';
import { ProjectStatusBadge, PriorityBadge } from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { AvatarGroup } from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProjectForm from '../components/projects/ProjectForm';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => { fetchProjects(); }, [statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await projectsAPI.getAll(params);
      setProjects(data.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectsAPI.delete(deleteTarget._id);
      setProjects(prev => prev.filter(p => p._id !== deleteTarget._id));
      toast.success('Project deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search ? 'No projects found' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={!search && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus size={16} /> Create Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project._id} className="card-hover p-5 group relative">
              {/* Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === project._id ? null : project._id); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
                >
                  <MoreVertical size={15} />
                </button>
                {openMenu === project._id && (
                  <div className="dropdown right-0 top-8">
                    <Link to={`/projects/${project._id}`} className="dropdown-item" onClick={() => setOpenMenu(null)}>
                      <ExternalLink size={14} /> View Details
                    </Link>
                    <button className="dropdown-item w-full" onClick={() => { setEditProject(project); setOpenMenu(null); }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      className="dropdown-item w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => { setDeleteTarget(project); setOpenMenu(null); }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <Link to={`/projects/${project._id}`} className="block">
                {/* Project header */}
                <div className="flex items-start gap-3 mb-3 pr-8">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: project.color + '20', border: `2px solid ${project.color}30` }}
                  >
                    {project.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{project.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{project.description || 'No description'}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <ProjectStatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{project.progress || 0}%</span>
                  </div>
                  <ProgressBar value={project.progress || 0} color="auto" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <AvatarGroup users={project.members?.map(m => m.user).filter(Boolean) || []} max={4} size="xs" />
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span>{project.taskCount?.total || 0} tasks</span>
                    {project.dueDate && (
                      <span className={new Date(project.dueDate) < new Date() ? 'text-red-500' : ''}>
                        Due {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editProject}
        onClose={() => { setShowCreateModal(false); setEditProject(null); }}
        title={editProject ? 'Edit Project' : 'Create New Project'}
        size="md"
      >
        <ProjectForm
          project={editProject}
          onSuccess={(project) => {
            if (editProject) {
              setProjects(prev => prev.map(p => p._id === project._id ? project : p));
            } else {
              setProjects(prev => [project, ...prev]);
            }
            setShowCreateModal(false);
            setEditProject(null);
            toast.success(editProject ? 'Project updated!' : 'Project created!');
          }}
          onCancel={() => { setShowCreateModal(false); setEditProject(null); }}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all tasks in this project.`}
        confirmLabel="Delete Project"
        isLoading={deleting}
      />
    </div>
  );
}
