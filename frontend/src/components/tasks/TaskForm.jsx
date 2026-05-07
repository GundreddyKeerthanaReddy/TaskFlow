import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { tasksAPI } from '../../lib/api';
import Avatar from '../ui/Avatar';

export default function TaskForm({ task, projectId, projectMembers = [], onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignees: task?.assignees?.map(a => a._id || a) || [],
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    estimatedHours: task?.estimatedHours || '',
    tags: task?.tags?.join(', ') || '',
    checklist: task?.checklist?.map(c => ({ text: c.text, completed: c.completed })) || []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newCheckItem, setNewCheckItem] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
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
        project: projectId,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : 0
      };
      const { data } = task
        ? await tasksAPI.update(task._id, payload)
        : await tasksAPI.create(payload);
      onSuccess(data.data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save task' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (userId) => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    setForm(prev => ({ ...prev, checklist: [...prev.checklist, { text: newCheckItem.trim(), completed: false }] }));
    setNewCheckItem('');
  };

  const removeChecklistItem = (idx) => {
    setForm(prev => ({ ...prev, checklist: prev.checklist.filter((_, i) => i !== idx) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.submit}
        </div>
      )}

      <div>
        <label className="label">Task Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="What needs to be done?"
          autoFocus
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input resize-none"
          rows={3}
          placeholder="Add more details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="completed">Completed</option>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Estimated Hours</label>
          <input
            type="number"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            className="input"
            placeholder="0"
            min="0"
            step="0.5"
          />
        </div>
      </div>

      {/* Assignees */}
      {projectMembers.length > 0 && (
        <div>
          <label className="label">Assignees</label>
          <div className="flex flex-wrap gap-2">
            {projectMembers.map(member => {
              const memberId = member._id || member;
              const isSelected = form.assignees.includes(memberId);
              return (
                <button
                  key={memberId}
                  type="button"
                  onClick={() => toggleAssignee(memberId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Avatar user={member} size="xs" />
                  <span>{member.name || 'Member'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="label">Tags (comma separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="input"
          placeholder="bug, feature, urgent"
        />
      </div>

      {/* Checklist */}
      <div>
        <label className="label">Checklist</label>
        <div className="space-y-2 mb-2">
          {form.checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => {
                  const updated = [...form.checklist];
                  updated[idx] = { ...item, completed: e.target.checked };
                  setForm({ ...form, checklist: updated });
                }}
                className="w-4 h-4 rounded border-slate-300 text-primary-600"
              />
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {item.text}
              </span>
              <button type="button" onClick={() => removeChecklistItem(idx)} className="text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCheckItem}
            onChange={(e) => setNewCheckItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
            className="input flex-1 text-sm"
            placeholder="Add checklist item..."
          />
          <button type="button" onClick={addChecklistItem} className="btn-secondary btn-sm">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
