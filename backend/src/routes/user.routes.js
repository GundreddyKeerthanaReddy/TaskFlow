const express = require('express');
const { getUsers, getUser, updateProfile, updateSettings, uploadAvatar, upload, getUserStats } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/me/stats', getUserStats);
router.get('/:id', getUser);
router.get('/:id/stats', getUserStats);
router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
