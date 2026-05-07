import { useState } from 'react';
import { projectsAPI } from '../../lib/api';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'
];

const PROJECT_ICONS = ['📋', '🚀', '💡', '🎯', '🔧', '📱', '🎨', '⚙️', '🔌', '📊', '🌐', '🏗️'];

export default function ProjectForm({ project, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium',
    color: project?.color || '#6366f1',
    icon: project?.icon || '📋',
    dueDate: project?.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
    tags: project?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Project name must be at least 2 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null
      };
      const { data } = project
        ? await projectsAPI.update(project._id, payload)
        : await projectsAPI.create(payload);
      onSuccess(data.data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save project' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.submit}
        </div>
      )}

      {/* Icon & Color */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm({ ...form, icon })}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === icon ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label">Project Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="e.g. Website Redesign"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input resize-none"
          rows={3}
          placeholder="What is this project about?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Due Date</label>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="input"
        />
      </div>

      <div>
        <label className="label">Tags (comma separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="input"
          placeholder="design, frontend, api"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
