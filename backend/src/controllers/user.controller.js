const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

// GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort('name').skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
  });
});

// GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw createError('User not found.', 404);
  res.json({ success: true, data: user });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'jobTitle', 'department', 'bio', 'phone', 'location'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', data: user.toSafeObject() });
});

// PUT /api/users/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { theme, notifications } = req.body;
  const updates = {};
  if (theme) updates.theme = theme;
  if (notifications) updates.notifications = notifications;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ success: true, message: 'Settings updated.', data: user.toSafeObject() });
});

// POST /api/users/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw createError('No file uploaded.', 400);

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });

  res.json({ success: true, message: 'Avatar uploaded.', data: { avatar: avatarUrl, user: user.toSafeObject() } });
});

// GET /api/users/:id/stats
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.id === 'me' ? req.user._id : req.params.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalAssigned, completedTasks, overdueTasks, recentCompleted] = await Promise.all([
    Task.countDocuments({ assignees: userId, isArchived: false }),
    Task.countDocuments({ assignees: userId, status: 'completed', isArchived: false }),
    Task.countDocuments({ assignees: userId, dueDate: { $lt: now }, status: { $ne: 'completed' }, isArchived: false }),
    Task.countDocuments({ assignees: userId, status: 'completed', completedAt: { $gte: thirtyDaysAgo } })
  ]);

  res.json({
    success: true,
    data: {
      totalAssigned,
      completedTasks,
      overdueTasks,
      recentCompleted,
      completionRate: totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0
    }
  });
});

module.exports = { getUsers, getUser, updateProfile, updateSettings, uploadAvatar, upload, getUserStats };
