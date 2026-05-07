const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');
const { asyncHandler, createError } = require('../middleware/error.middleware');

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const { status, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const filter = {
    $or: [{ owner: userId }, { 'members.user': userId }],
    isArchived: false
  };

  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Project.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar jobTitle')
    .populate('members.user', 'name email avatar jobTitle');

  if (!project) throw createError('Project not found.', 404);

  const isMember = project.owner._id.toString() === req.user._id.toString() ||
    project.members.some(m => m.user._id.toString() === req.user._id.toString());

  if (!isMember) throw createError('Access denied.', 403);

  res.json({ success: true, data: project });
});

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, priority, color, icon, dueDate, tags } = req.body;

  const project = await Project.create({
    name,
    description,
    status,
    priority,
    color: color || '#6366f1',
    icon: icon || '📋',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
    dueDate: dueDate || null,
    tags: tags || []
  });

  await project.populate('owner', 'name email avatar');

  await ActivityLog.create({
    actor: req.user._id,
    action: 'created',
    entityType: 'project',
    entityId: project._id,
    entityTitle: project.name,
    project: project._id,
    description: `${req.user.name} created project "${project.name}"`
  });

  res.status(201).json({ success: true, message: 'Project created.', data: project });
});

// PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw createError('Project not found.', 404);

  const isOwnerOrAdmin = project.owner.toString() === req.user._id.toString() ||
    project.members.some(m => m.user.toString() === req.user._id.toString() && ['owner', 'admin'].includes(m.role));

  if (!isOwnerOrAdmin) throw createError('Permission denied.', 403);

  const allowedFields = ['name', 'description', 'status', 'priority', 'color', 'icon', 'dueDate', 'startDate', 'tags'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  if (req.body.status === 'completed' && !project.completedAt) {
    project.completedAt = new Date();
  }

  await project.save();
  await project.populate('owner', 'name email avatar');
  await project.populate('members.user', 'name email avatar');

  await ActivityLog.create({
    actor: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    entityTitle: project.name,
    project: project._id,
    description: `${req.user.name} updated project "${project.name}"`
  });

  res.json({ success: true, message: 'Project updated.', data: project });
});

// DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw createError('Project not found.', 404);

  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createError('Only the project owner can delete this project.', 403);
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: 'Project and all its tasks deleted.' });
});

// POST /api/projects/:id/members
const addMember = asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) throw createError('Project not found.', 404);

  const isOwnerOrAdmin = project.owner.toString() === req.user._id.toString() ||
    project.members.some(m => m.user.toString() === req.user._id.toString() && ['owner', 'admin'].includes(m.role));

  if (!isOwnerOrAdmin) throw createError('Permission denied.', 403);

  const alreadyMember = project.members.some(m => m.user.toString() === userId);
  if (alreadyMember) throw createError('User is already a member.', 409);

  project.members.push({ user: userId, role });
  await project.save();
  await project.populate('members.user', 'name email avatar');

  await Notification.create({
    recipient: userId,
    sender: req.user._id,
    type: 'project_invite',
    title: 'Added to Project',
    message: `${req.user.name} added you to project "${project.name}"`,
    entityType: 'project',
    entityId: project._id,
    link: `/projects/${project._id}`
  });

  res.json({ success: true, message: 'Member added.', data: project });
});

// DELETE /api/projects/:id/members/:userId
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw createError('Project not found.', 404);

  const isOwnerOrAdmin = project.owner.toString() === req.user._id.toString() ||
    project.members.some(m => m.user.toString() === req.user._id.toString() && ['owner', 'admin'].includes(m.role));

  if (!isOwnerOrAdmin && req.params.userId !== req.user._id.toString()) {
    throw createError('Permission denied.', 403);
  }

  project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
  await project.save();

  res.json({ success: true, message: 'Member removed.' });
});

// GET /api/projects/:id/stats
const getProjectStats = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw createError('Project not found.', 404);

  const tasks = await Task.find({ project: project._id, isArchived: false });
  const now = new Date();

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    inReview: tasks.filter(t => t.status === 'in-review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
    highPriority: tasks.filter(t => ['high', 'critical'].includes(t.priority)).length,
    progress: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
  };

  // Update project task counts
  project.taskCount = { total: stats.total, todo: stats.todo, inProgress: stats.inProgress, completed: stats.completed };
  await project.save({ validateBeforeSave: false });

  res.json({ success: true, data: stats });
});

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember, getProjectStats };
