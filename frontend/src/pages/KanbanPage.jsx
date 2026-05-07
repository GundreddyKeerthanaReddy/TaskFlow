import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectsAPI, tasksAPI } from '../lib/api';
import { PriorityBadge } from '../components/ui/Badge';
import { AvatarGroup } from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import TaskForm from '../components/tasks/TaskForm';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { Calendar, MessageSquare, CheckSquare, GripVertical } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400', headerBg: 'bg-slate-50 dark:bg-slate-800/50' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500', headerBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'in-review', label: 'In Review', color: 'bg-purple-500', headerBg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-500', headerBg: 'bg-emerald-50 dark:bg-emerald-900/20' }
];

function KanbanTaskCard({ task, isDragging = false }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const checklistDone = task.checklist?.filter(c => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm ${isDragging ? 'shadow-lg rotate-2 opacity-90' : 'hover:shadow-card-hover'} transition-all cursor-grab active:cursor-grabbing`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug flex-1">{task.title}</h4>
        <GripVertical size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <PriorityBadge priority={task.priority} />
        {task.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="badge-neutral text-xs">{tag}</span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={10} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare size={10} />
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={10} />
              {task.comments.length}
            </span>
          )}
        </div>
        {task.assignees?.length > 0 && (
          <AvatarGroup users={task.assignees} max={2} size="xs" />
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanTaskCard task={task} />
    </div>
  );
}

export default function KanbanPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll({ project: id })
      ]);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const getColumnTasks = (status) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const findTaskColumn = (taskId) => tasks.find(t => t._id === taskId)?.status;

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine target column
    const targetColumn = COLUMNS.find(c => c.id === overId)?.id || findTaskColumn(overId);
    if (!targetColumn) return;

    const currentTask = tasks.find(t => t._id === activeId);
    if (!currentTask || currentTask.status === targetColumn) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === activeId ? { ...t, status: targetColumn } : t));

    try {
      await tasksAPI.move(activeId, { status: targetColumn, position: 0 });
    } catch {
      toast.error('Failed to move task');
      fetchData(); // revert
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-3 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${id}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <ArrowLeft size={16} /> {project?.name}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Kanban Board</span>
        </div>
        <button onClick={() => { setDefaultStatus('todo'); setShowTaskModal(true); }} className="btn-primary btn-sm">
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {COLUMNS.map(column => {
            const columnTasks = getColumnTasks(column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${column.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{column.label}</span>
                    <span className="badge-neutral text-xs">{columnTasks.length}</span>
                  </div>
                  <button
                    onClick={() => { setDefaultStatus(column.id); setShowTaskModal(true); }}
                    className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-500 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Drop zone */}
                <SortableContext
                  items={columnTasks.map(t => t._id)}
                  strategy={verticalListSortingStrategy}
                  id={column.id}
                >
                  <div
                    className="space-y-2 min-h-[200px] rounded-xl p-1"
                    data-column={column.id}
                  >
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-xs text-slate-400 dark:text-slate-500">Drop tasks here</p>
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <SortableTaskCard key={task._id} task={task} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && <KanbanTaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Task modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create Task"
        size="lg"
      >
        <TaskForm
          projectId={id}
          task={defaultStatus !== 'todo' ? { status: defaultStatus } : null}
          projectMembers={project?.members?.map(m => m.user).filter(Boolean) || []}
          onSuccess={(task) => {
            setTasks(prev => [...prev, task]);
            setShowTaskModal(false);
            toast.success('Task created!');
          }}
          onCancel={() => setShowTaskModal(false)}
        />
      </Modal>
    </div>
  );
}
