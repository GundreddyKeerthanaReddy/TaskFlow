const Team = require('../models/Team.model');
const User = require('../models/User.model');
const { asyncHandler, createError } = require('../middleware/error.middleware');

// GET /api/teams
const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    isActive: true
  })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar jobTitle')
    .sort('-createdAt');

  res.json({ success: true, data: teams });
});

// GET /api/teams/:id
const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar jobTitle department');

  if (!team) throw createError('Team not found.', 404);

  const isMember = team.owner._id.toString() === req.user._id.toString() ||
    team.members.some(m => m.user._id.toString() === req.user._id.toString());
  if (!isMember) throw createError('Access denied.', 403);

  res.json({ success: true, data: team });
});

// POST /api/teams
const createTeam = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  const team = await Team.create({
    name,
    description,
    color: color || '#6366f1',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }]
  });

  await team.populate('owner', 'name email avatar');
  res.status(201).json({ success: true, message: 'Team created.', data: team });
});

// PUT /api/teams/:id
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw createError('Team not found.', 404);

  if (team.owner.toString() !== req.user._id.toString()) throw createError('Only team owner can update.', 403);

  const { name, description, color } = req.body;
  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (color) team.color = color;

  await team.save();
  res.json({ success: true, message: 'Team updated.', data: team });
});

// DELETE /api/teams/:id
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw createError('Team not found.', 404);
  if (team.owner.toString() !== req.user._id.toString()) throw createError('Only team owner can delete.', 403);

  await team.deleteOne();
  res.json({ success: true, message: 'Team deleted.' });
});

// POST /api/teams/:id/members
const addTeamMember = asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) throw createError('Team not found.', 404);

  const isAdminOrOwner = team.owner.toString() === req.user._id.toString() ||
    team.members.some(m => m.user.toString() === req.user._id.toString() && ['owner', 'admin'].includes(m.role));
  if (!isAdminOrOwner) throw createError('Permission denied.', 403);

  const alreadyMember = team.members.some(m => m.user.toString() === userId);
  if (alreadyMember) throw createError('User is already a team member.', 409);

  const user = await User.findById(userId);
  if (!user) throw createError('User not found.', 404);

  team.members.push({ user: userId, role });
  await team.save();
  await team.populate('members.user', 'name email avatar jobTitle');

  res.json({ success: true, message: 'Member added.', data: team });
});

// DELETE /api/teams/:id/members/:userId
const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw createError('Team not found.', 404);

  const isAdminOrOwner = team.owner.toString() === req.user._id.toString() ||
    team.members.some(m => m.user.toString() === req.user._id.toString() && ['owner', 'admin'].includes(m.role));

  if (!isAdminOrOwner && req.params.userId !== req.user._id.toString()) {
    throw createError('Permission denied.', 403);
  }

  team.members = team.members.filter(m => m.user.toString() !== req.params.userId);
  await team.save();

  res.json({ success: true, message: 'Member removed.' });
});

// PATCH /api/teams/:id/members/:userId/role
const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) throw createError('Team not found.', 404);

  if (team.owner.toString() !== req.user._id.toString()) throw createError('Only owner can change roles.', 403);

  const member = team.members.find(m => m.user.toString() === req.params.userId);
  if (!member) throw createError('Member not found.', 404);

  member.role = role;
  await team.save();

  res.json({ success: true, message: 'Role updated.' });
});

module.exports = { getTeams, getTeam, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, updateMemberRole };
