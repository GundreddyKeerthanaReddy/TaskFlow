const express = require('express');
const {
  getTeams, getTeam, createTeam, updateTeam, deleteTeam,
  addTeamMember, removeTeamMember, updateMemberRole
} = require('../controllers/team.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getTeams);
router.post('/', createTeam);
router.get('/:id', getTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:userId', removeTeamMember);
router.patch('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
