const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');
const { asyncHandler, createError } = require('../middleware/error.middleware');

const updateProjectTaskCounts = async (projectId) => {
  const tasks = await Task.find({ project: projectId, isArchived: false });
  await Project.findByIdAndUpdate(projectId, {
    'taskCount.total': tasks.length,
    'taskCount.todo': tasks.filter(t => t.status === 'todo').length,
    'taskCount.inProgress': tasks.filter(t => t.status === 'in-progress').length,
    'taskCount.completed': tasks.filter(t => t.status === 'completed').length
  });
};

// GET /api/tasks
const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignee, search, sort = 'position', page = 1, limit = 50 } = req.query;

  const filter = { isArchived: false };
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignees = assignee;
  if (search) filter.$text = { $search: search };

  // Only show tasks from projects user is member of
  if (!project) {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');
    filter.project = { $in: userProjects.map(p => p._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Task.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name email avatar jobTitle')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color members owner')
    .populate('comments.author', 'name email avatar');

  if (!task) throw createError('Task not found.', 404);

  res.json({ success: true, data: task });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, project: projectId, assignees, dueDate, tags, estimatedHours, checklist } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw createError('Project not found.', 404);

  const isMember = project.owner.toString() === req.user._id.toString() ||
    project.members.some(m => m.user.toString() === req.user._id.toString());
  if (!isMember) throw createError('Access denied.', 403);

  // Get max position for the status column
  const maxPositionTask = await Task.findOne({ project: projectId, status: status || 'todo' })
    .sort('-position').select('position');
  const position = maxPositionTask ? maxPositionTask.position + 1 : 0;

  const task = await Task.create({
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    project: projectId,
    assignees: assignees || [],
    createdBy: req.user._id,
    dueDate: dueDate || null,
    tags: tags || [],
    estimatedHours: estimatedHours || 0,
    checklist: checklist || [],
    position
  });

  await task.populate('assignees', 'name email avatar');
  await task.populate('createdBy', 'name email avatar');
  await task.populate('project', 'name color');

  await updateProjectTaskCounts(projectId);

  // Notify assignees
  if (assignees && assignees.length > 0) {
    const notifications = assignees
      .filter(uid => uid.toString() !== req.user._id.toString())
      .map(uid => ({
        recipient: uid,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you to "${title}"`,
        entityType: 'task',
        entityId: task._id,
        link: `/tasks/${task._id}`
      }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
  }

  await ActivityLog.create({
    actor: req.user._id,
    action: 'created',
    entityType: 'task',
    entityId: task._id,
    entityTitle: task.title,
    project: projectId,
    description: `${req.user.name} created task "${task.title}"`
  });

  res.status(201).json({ success: true, message: 'Task created.', data: task });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  const prevStatus = task.status;
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignees', 'dueDate', 'tags', 'estimatedHours', 'loggedHours', 'position'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  if (req.body.status === 'completed' && prevStatus !== 'completed') {
    task.completedAt = new Date();
  } else if (req.body.status && req.body.status !== 'completed') {
    task.completedAt = null;
  }

  await task.save();
  await task.populate('assignees', 'name email avatar');
  await task.populate('createdBy', 'name email avatar');
  await task.populate('project', 'name color');

  await updateProjectTaskCounts(task.project);

  const action = req.body.status && req.body.status !== prevStatus ? 'status_changed' : 'updated';
  await ActivityLog.create({
    actor: req.user._id,
    action,
    entityType: 'task',
    entityId: task._id,
    entityTitle: task.title,
    project: task.project,
    metadata: req.body.status ? { from: prevStatus, to: req.body.status } : {},
    description: `${req.user.name} ${action === 'status_changed' ? `moved "${task.title}" to ${req.body.status}` : `updated "${task.title}"`}`
  });

  res.json({ success: true, message: 'Task updated.', data: task });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  const projectId = task.project;
  await task.deleteOne();
  await updateProjectTaskCounts(projectId);

  res.json({ success: true, message: 'Task deleted.' });
});

// PATCH /api/tasks/:id/move
const moveTask = asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  const prevStatus = task.status;
  task.status = status;
  task.position = position;
  if (status === 'completed' && prevStatus !== 'completed') task.completedAt = new Date();
  if (status !== 'completed') task.completedAt = null;

  await task.save();
  await updateProjectTaskCounts(task.project);

  if (prevStatus !== status) {
    await ActivityLog.create({
      actor: req.user._id,
      action: 'moved',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      project: task.project,
      metadata: { from: prevStatus, to: status },
      description: `${req.user.name} moved "${task.title}" from ${prevStatus} to ${status}`
    });
  }

  res.json({ success: true, message: 'Task moved.', data: task });
});

// POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  task.comments.push({ author: req.user._id, text });
  await task.save();
  await task.populate('comments.author', 'name email avatar');

  const newComment = task.comments[task.comments.length - 1];

  await ActivityLog.create({
    actor: req.user._id,
    action: 'commented',
    entityType: 'task',
    entityId: task._id,
    entityTitle: task.title,
    project: task.project,
    description: `${req.user.name} commented on "${task.title}"`
  });

  res.status(201).json({ success: true, message: 'Comment added.', data: newComment });
});

// DELETE /api/tasks/:id/comments/:commentId
const deleteComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  const comment = task.comments.id(req.params.commentId);
  if (!comment) throw createError('Comment not found.', 404);

  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createError('Permission denied.', 403);
  }

  comment.deleteOne();
  await task.save();

  res.json({ success: true, message: 'Comment deleted.' });
});

// PATCH /api/tasks/:id/checklist/:itemId
const updateChecklistItem = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw createError('Task not found.', 404);

  const item = task.checklist.id(req.params.itemId);
  if (!item) throw createError('Checklist item not found.', 404);

  item.completed = req.body.completed;
  item.completedAt = req.body.completed ? new Date() : null;
  item.completedBy = req.body.completed ? req.user._id : null;
  if (req.body.text) item.text = req.body.text;

  await task.save();

  res.json({ success: true, message: 'Checklist updated.', data: task });
});

module.exports = {
  getTasks, getTask, createTask, updateTask, deleteTask,
  moveTask, addComment, deleteComment, updateChecklistItem
};
