const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const ActivityLog = require('../models/ActivityLog.model');
const User = require('../models/User.model');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/analytics/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const userProjects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
    isArchived: false
  }).select('_id');
  const projectIds = userProjects.map(p => p._id);

  const [
    totalProjects, activeProjects, totalTasks, completedTasks,
    overdueTasks, inProgressTasks, weeklyCompleted, recentActivity
  ] = await Promise.all([
    Project.countDocuments({ _id: { $in: projectIds } }),
    Project.countDocuments({ _id: { $in: projectIds }, status: 'active' }),
    Task.countDocuments({ project: { $in: projectIds }, isArchived: false }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'completed', isArchived: false }),
    Task.countDocuments({ project: { $in: projectIds }, dueDate: { $lt: now }, status: { $ne: 'completed' }, isArchived: false }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress', isArchived: false }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'completed', completedAt: { $gte: startOfWeek }, isArchived: false }),
    ActivityLog.find({ project: { $in: projectIds } })
      .populate('actor', 'name avatar')
      .sort('-createdAt')
      .limit(10)
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        weeklyCompleted,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      recentActivity
    }
  });
});

// GET /api/analytics/productivity
const getProductivityData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = '7' } = req.query;
  const days = parseInt(period);
  const now = new Date();

  const userProjects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }]
  }).select('_id');
  const projectIds = userProjects.map(p => p._id);

  // Build daily data for the past N days
  const dailyData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const [created, completed] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds }, createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'completed', completedAt: { $gte: startOfDay, $lte: endOfDay } })
    ]);

    dailyData.push({
      date: startOfDay.toISOString().split('T')[0],
      label: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      created,
      completed
    });
  }

  // Priority distribution
  const priorityDist = await Task.aggregate([
    { $match: { project: { $in: projectIds }, isArchived: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Status distribution
  const statusDist = await Task.aggregate([
    { $match: { project: { $in: projectIds }, isArchived: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Project progress
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('name taskCount color status')
    .limit(6);

  res.json({
    success: true,
    data: {
      dailyData,
      priorityDistribution: priorityDist.map(d => ({ name: d._id, value: d.count })),
      statusDistribution: statusDist.map(d => ({ name: d._id, value: d.count })),
      projectProgress: projects.map(p => ({
        name: p.name,
        color: p.color,
        progress: p.taskCount.total > 0 ? Math.round((p.taskCount.completed / p.taskCount.total) * 100) : 0,
        total: p.taskCount.total,
        completed: p.taskCount.completed
      }))
    }
  });
});

// GET /api/analytics/team
const getTeamAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const userProjects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }]
  }).select('_id members');
  const projectIds = userProjects.map(p => p._id);

  // Get unique team members
  const memberIds = new Set();
  userProjects.forEach(p => p.members.forEach(m => memberIds.add(m.user.toString())));

  const members = await User.find({ _id: { $in: [...memberIds] } }).select('name email avatar jobTitle');

  const memberStats = await Promise.all(members.map(async (member) => {
    const [assigned, completed, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds }, assignees: member._id, isArchived: false }),
      Task.countDocuments({ project: { $in: projectIds }, assignees: member._id, status: 'completed', isArchived: false }),
      Task.countDocuments({ project: { $in: projectIds }, assignees: member._id, dueDate: { $lt: new Date() }, status: { $ne: 'completed' }, isArchived: false })
    ]);
    return {
      user: member,
      assigned,
      completed,
      overdue,
      completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0
    };
  }));

  res.json({ success: true, data: { memberStats } });
});

module.exports = { getDashboardStats, getProductivityData, getTeamAnalytics };
