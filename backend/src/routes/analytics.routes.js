const express = require('express');
const { getDashboardStats, getProductivityData, getTeamAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/productivity', getProductivityData);
router.get('/team', getTeamAnalytics);

module.exports = router;
