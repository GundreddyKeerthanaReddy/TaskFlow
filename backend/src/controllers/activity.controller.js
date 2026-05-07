const ActivityLog = require('../models/ActivityLog.model');
const Project = require('../models/Project.model');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/activities
const getActivities = asyncHandler(async (req, res) => {
  const { project, limit = 20, page = 1 } = req.query;
  const userId = req.user._id;

  let filter = {};

  if (project) {
    filter.project = project;
  } else {
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    }).select('_id');
    filter.project = { $in: userProjects.map(p => p._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('actor', 'name avatar email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    ActivityLog.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: activities,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) }
  });
});

module.exports = { getActivities };
