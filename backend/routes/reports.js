const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getTopEmployees,
  getInactiveCustomers
} = require('../controllers/reportController');

router.route('/dashboard')
  .get(protect, getDashboardStats);

router.route('/top-employees')
  .get(protect, authorize('Admin', 'Supervisor'), getTopEmployees);

router.route('/inactive-customers')
  .get(protect, getInactiveCustomers);

module.exports = router;
